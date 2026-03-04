import { OrderStatus, Prisma } from "@prisma/client";
import { toPagination } from "../../lib/pagination";
import { prisma } from "../../lib/prisma";

type ListOrdersInput = {
  userId: string;
  page: number;
  limit: number;
  sortBy: "createdAt";
  sortOrder: "asc" | "desc";
  status?: OrderStatus;
};

export const orderService = {
  list: async (input: ListOrdersInput) => {
    const pagination = toPagination(input.page, input.limit);
    const where: Prisma.OrderWhereInput = {
      userId: input.userId,
      status: input.status,
    };

    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          reservation: {
            include: { product: true },
          },
        },
        orderBy: {
          [input.sortBy]: input.sortOrder,
        },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      items,
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    };
  },
};
