import { InventoryEventType, Prisma } from "@prisma/client";
import { toPagination } from "../../lib/pagination";
import { prisma } from "../../lib/prisma";

type ListInventoryLogsInput = {
  page: number;
  limit: number;
  sortBy: "createdAt";
  sortOrder: "asc" | "desc";
  productId?: string;
  eventType?: InventoryEventType;
};

export const inventoryService = {
  list: async (input: ListInventoryLogsInput) => {
    const pagination = toPagination(input.page, input.limit);
    const where: Prisma.InventoryLogWhereInput = {
      productId: input.productId,
      eventType: input.eventType,
    };

    const [items, total] = await prisma.$transaction([
      prisma.inventoryLog.findMany({
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
      prisma.inventoryLog.count({ where }),
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
