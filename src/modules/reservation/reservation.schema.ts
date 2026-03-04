import { ReservationStatus } from "@prisma/client";
import { z } from "zod";
import { paginationQuerySchema } from "../../lib/pagination";

export const reserveSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive().max(1000),
});

export const checkoutSchema = z.object({
  reservationId: z.string().cuid(),
});

export const listReservationsQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(["createdAt", "expiresAt"]).default("createdAt"),
  status: z.nativeEnum(ReservationStatus).optional(),
  productId: z.string().cuid().optional(),
});
