import { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    logger.info("request_completed", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: req.ip,
      userId: req.auth?.userId,
    });
  });

  next();
};
