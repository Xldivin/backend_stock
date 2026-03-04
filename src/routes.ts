import { Router } from "express";
import { asyncHandler } from "./lib/async-handler";
import { prisma } from "./lib/prisma";
import { authenticate } from "./middleware/auth";
import { validate } from "./middleware/validate";
import { authController } from "./modules/auth/auth.controller";
import { loginSchema, registerSchema } from "./modules/auth/auth.schema";
import { inventoryController } from "./modules/inventory/inventory.controller";
import { listInventoryLogsQuerySchema } from "./modules/inventory/inventory.schema";
import { orderController } from "./modules/order/order.controller";
import { listOrdersQuerySchema } from "./modules/order/order.schema";
import { productController } from "./modules/product/product.controller";
import { createProductSchema, listProductsQuerySchema } from "./modules/product/product.schema";
import { reservationController } from "./modules/reservation/reservation.controller";
import {
  checkoutSchema,
  listReservationsQuerySchema,
  reserveSchema,
} from "./modules/reservation/reservation.schema";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "stock_drop_be", timestamp: new Date().toISOString() });
});

apiRouter.get("/health/db", asyncHandler(async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ok: true, db: "reachable" });
  } catch (error) {
    res.status(500).json({
      ok: false,
      db: "unreachable",
      error: (error as Error).message,
    });
  }
}));

apiRouter.post("/auth/register", validate({ body: registerSchema }), asyncHandler(authController.register));
apiRouter.post("/auth/login", validate({ body: loginSchema }), asyncHandler(authController.login));

apiRouter.post("/products", validate({ body: createProductSchema }), asyncHandler(productController.create));
apiRouter.get("/products", validate({ query: listProductsQuerySchema }), asyncHandler(productController.list));

apiRouter.post(
  "/reserve",
  authenticate,
  validate({ body: reserveSchema }),
  asyncHandler(reservationController.reserve),
);
apiRouter.post(
  "/checkout",
  authenticate,
  validate({ body: checkoutSchema }),
  asyncHandler(reservationController.checkout),
);
apiRouter.get(
  "/reservations",
  authenticate,
  validate({ query: listReservationsQuerySchema }),
  asyncHandler(reservationController.list),
);

apiRouter.get(
  "/orders",
  authenticate,
  validate({ query: listOrdersQuerySchema }),
  asyncHandler(orderController.list),
);
apiRouter.get(
  "/inventory-logs",
  validate({ query: listInventoryLogsQuerySchema }),
  asyncHandler(inventoryController.list),
);
