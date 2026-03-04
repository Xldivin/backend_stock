import { InventoryEventType } from "@prisma/client";
import { z } from "zod";
import { paginationQuerySchema } from "../../lib/pagination";

export const listInventoryLogsQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(["createdAt"]).default("createdAt"),
  productId: z.string().cuid().optional(),
  eventType: z.nativeEnum(InventoryEventType).optional(),
});
