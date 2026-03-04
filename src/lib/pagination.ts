import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const toPagination = (page: number, limit: number) => ({
  page,
  limit,
  skip: (page - 1) * limit,
  take: limit,
});
