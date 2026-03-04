import { Prisma } from "@prisma/client";
import { AppError } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { toPagination } from "../../lib/pagination";

type CreateProductInput = {
  sku: string;
  name: string;
  description?: string;
  stock: number;
};

type ListProductsInput = {
  page: number;
  limit: number;
  sortBy: "createdAt" | "name" | "availableStock";
  sortOrder: "asc" | "desc";
  name?: string;
  minStock?: number;
  maxStock?: number;
};

export const productService = {
  create: async (input: CreateProductInput) => {
    try {
      return await prisma.product.create({
        data: {
          sku: input.sku,
          name: input.name,
          description: input.description,
          totalStock: input.stock,
          availableStock: input.stock,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(409, "SKU_EXISTS", "A product with this SKU already exists");
      }
      throw error;
    }
  },

  list: async (input: ListProductsInput) => {
    const pagination = toPagination(input.page, input.limit);

    const where: Prisma.ProductWhereInput = {
      name: input.name
        ? {
            contains: input.name,
            mode: "insensitive",
          }
        : undefined,
      availableStock: {
        gte: input.minStock,
        lte: input.maxStock,
      },
    };

    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy: {
          [input.sortBy]: input.sortOrder,
        },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.product.count({ where }),
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
