import { OrderStatus } from "@prisma/client";
import { z } from "zod";
import { paginationQuerySchema } from "../../lib/pagination";

export const listOrdersQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(["createdAt"]).default("createdAt"),
  status: z.nativeEnum(OrderStatus).optional(),
});
