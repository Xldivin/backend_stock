import { InventoryEventType, Prisma, ReservationStatus } from "@prisma/client";
import { env } from "../../config/env";
import { AppError } from "../../lib/errors";
import { toPagination } from "../../lib/pagination";
import { prisma } from "../../lib/prisma";

type ReserveInput = {
  productId: string;
  quantity: number;
};

type CheckoutInput = {
  reservationId: string;
};

type ListReservationsInput = {
  userId: string;
  page: number;
  limit: number;
  sortBy: "createdAt" | "expiresAt";
  sortOrder: "asc" | "desc";
  status?: ReservationStatus;
  productId?: string;
};

const reservationActiveKey = (userId: string, productId: string) => `${userId}:${productId}`;

export const reservationService = {
  reserve: async (userId: string, input: ReserveInput) => {
    const expiresAt = new Date(Date.now() + env.RESERVATION_EXPIRY_MINUTES * 60 * 1000);
    const activeKey = reservationActiveKey(userId, input.productId);

    try {
      return await prisma.$transaction(
        async (tx) => {
          const product = await tx.product.findUnique({
            where: { id: input.productId },
            select: { id: true, availableStock: true },
          });

          if (!product) {
            throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
          }

          if (product.availableStock < input.quantity) {
            throw new AppError(409, "INSUFFICIENT_STOCK", "Not enough stock available");
          }

          const stockUpdated = await tx.product.updateMany({
            where: {
              id: input.productId,
              availableStock: { gte: input.quantity },
            },
            data: {
              availableStock: { decrement: input.quantity },
            },
          });

          if (stockUpdated.count !== 1) {
            throw new AppError(409, "INSUFFICIENT_STOCK", "Not enough stock available");
          }

          const reservation = await tx.reservation.create({
            data: {
              userId,
              productId: input.productId,
              quantity: input.quantity,
              expiresAt,
              activeKey,
            },
          });

          await tx.inventoryLog.create({
            data: {
              productId: input.productId,
              reservationId: reservation.id,
              eventType: InventoryEventType.RESERVE,
              delta: -input.quantity,
              reason: "Stock held for reservation",
            },
          });

          return reservation;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5_000,
          timeout: 15_000,
        },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(
          409,
          "DUPLICATE_ACTIVE_RESERVATION",
          "You already have an active reservation for this product",
        );
      }
      throw error;
    }
  },

  checkout: async (userId: string, input: CheckoutInput) =>
    prisma.$transaction(
      async (tx) => {
        const now = new Date();
        const reservation = await tx.reservation.findUnique({
          where: { id: input.reservationId },
          include: { product: true },
        });

        if (!reservation || reservation.userId !== userId) {
          throw new AppError(404, "RESERVATION_NOT_FOUND", "Reservation not found");
        }

        if (reservation.status !== ReservationStatus.ACTIVE) {
          throw new AppError(409, "RESERVATION_NOT_ACTIVE", "Reservation is not active");
        }

        if (reservation.expiresAt <= now) {
          throw new AppError(409, "RESERVATION_EXPIRED", "Reservation is expired");
        }

        const reservationUpdate = await tx.reservation.updateMany({
          where: {
            id: reservation.id,
            status: ReservationStatus.ACTIVE,
            expiresAt: { gt: now },
          },
          data: {
            status: ReservationStatus.COMPLETED,
            completedAt: now,
            activeKey: null,
          },
        });

        if (reservationUpdate.count !== 1) {
          throw new AppError(409, "RESERVATION_CONFLICT", "Reservation was already processed");
        }

        const order = await tx.order.create({
          data: {
            userId,
            reservationId: reservation.id,
            status: "CONFIRMED",
            items: {
              create: {
                productId: reservation.productId,
                quantity: reservation.quantity,
              },
            },
          },
          include: {
            items: true,
          },
        });

        await tx.inventoryLog.create({
          data: {
            productId: reservation.productId,
            reservationId: reservation.id,
            orderId: order.id,
            eventType: InventoryEventType.CHECKOUT,
            delta: 0,
            reason: "Reservation converted to order",
          },
        });

        return order;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 15_000,
      },
    ),

  list: async (input: ListReservationsInput) => {
    const pagination = toPagination(input.page, input.limit);
    const where: Prisma.ReservationWhereInput = {
      userId: input.userId,
      status: input.status,
      productId: input.productId,
    };

    const [items, total] = await prisma.$transaction([
      prisma.reservation.findMany({
        where,
        include: {
          product: true,
        },
        orderBy: {
          [input.sortBy]: input.sortOrder,
        },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.reservation.count({ where }),
    ]);

    return {
      items,
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    };
  },

  expireDueReservations: async (batchSize = 100) => {
    const now = new Date();
    const dueReservations = await prisma.reservation.findMany({
      where: {
        status: ReservationStatus.ACTIVE,
        expiresAt: { lte: now },
      },
      orderBy: { expiresAt: "asc" },
      take: batchSize,
      select: { id: true },
    });

    let expiredCount = 0;
    for (const reservation of dueReservations) {
      expiredCount += await prisma.$transaction(
        async (tx) => expireReservation(tx, reservation.id, now),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5_000,
          timeout: 15_000,
        },
      );
    }

    return expiredCount;
  },
};

const expireReservation = async (
  tx: Prisma.TransactionClient,
  reservationId: string,
  now: Date,
): Promise<number> => {
  const reservation = await tx.reservation.findUnique({
    where: { id: reservationId },
  });

  if (
    !reservation ||
    reservation.status !== ReservationStatus.ACTIVE ||
    reservation.expiresAt > now
  ) {
    return 0;
  }

  const updated = await tx.reservation.updateMany({
    where: {
      id: reservation.id,
      status: ReservationStatus.ACTIVE,
    },
    data: {
      status: ReservationStatus.EXPIRED,
      activeKey: null,
    },
  });

  if (updated.count !== 1) {
    return 0;
  }

  await tx.product.update({
    where: { id: reservation.productId },
    data: {
      availableStock: {
        increment: reservation.quantity,
      },
    },
  });

  await tx.inventoryLog.create({
    data: {
      productId: reservation.productId,
      reservationId: reservation.id,
      eventType: InventoryEventType.RELEASE,
      delta: reservation.quantity,
      reason: "Reservation expired and stock restored",
    },
  });

  return 1;
};
