import { logger } from "../lib/logger";
import { reservationService } from "../modules/reservation/reservation.service";

let workerTimer: NodeJS.Timeout | null = null;

export const startReservationExpiryWorker = () => {
  if (workerTimer) {
    return;
  }

  workerTimer = setInterval(async () => {
    try {
      const expired = await reservationService.expireDueReservations();
      if (expired > 0) {
        logger.info("reservations_expired", { expiredCount: expired });
      }
    } catch (error) {
      logger.error("reservation_expiry_worker_failed", {
        message: (error as Error).message,
      });
    }
  }, 30_000);

  logger.info("reservation_expiry_worker_started", { intervalMs: 30_000 });
};
