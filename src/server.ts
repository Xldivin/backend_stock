import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { startReservationExpiryWorker } from "./workers/reservation-expiry.worker";

const port = env.PORT;

app.listen(port, () => {
  logger.info("server_started", { port, baseUrl: `http://localhost:${port}/api` });
  startReservationExpiryWorker();
});

const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
