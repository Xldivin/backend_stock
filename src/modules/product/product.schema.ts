import { z } from "zod";
import { paginationQuerySchema } from "../../lib/pagination";

export const createProductSchema = z.object({
  sku: z.string().trim().min(2).max(64),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(500).optional(),
  stock: z.number().int().positive(),
});

export const listProductsQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(["createdAt", "name", "availableStock"]).default("createdAt"),
  name: z.string().trim().min(1).optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  maxStock: z.coerce.number().int().min(0).optional(),
});
