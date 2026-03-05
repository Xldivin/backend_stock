import { Router } from "express";
import { asyncHandler } from "./lib/async-handler";
import { prisma } from "./lib/prisma";
import { validate } from "./middleware/validate";
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

apiRouter.get("/metrics", (_req, res) => {
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    service: "stock_drop_be",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssBytes: memoryUsage.rss,
      heapTotalBytes: memoryUsage.heapTotal,
      heapUsedBytes: memoryUsage.heapUsed,
      externalBytes: memoryUsage.external,
    },
  });
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

apiRouter.post("/products", validate({ body: createProductSchema }), asyncHandler(productController.create));
apiRouter.get("/products", validate({ query: listProductsQuerySchema }), asyncHandler(productController.list));

apiRouter.post(
  "/reserve",
  validate({ body: reserveSchema }),
  asyncHandler(reservationController.reserve),
);
apiRouter.post(
  "/checkout",
  validate({ body: checkoutSchema }),
  asyncHandler(reservationController.checkout),
);
apiRouter.get(
  "/reservations",
  validate({ query: listReservationsQuerySchema }),
  asyncHandler(reservationController.list),
);

apiRouter.get(
  "/orders",
  validate({ query: listOrdersQuerySchema }),
  asyncHandler(orderController.list),
);
apiRouter.get(
  "/inventory-logs",
  validate({ query: listInventoryLogsQuerySchema }),
  asyncHandler(inventoryController.list),
);
