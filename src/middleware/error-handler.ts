import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, "NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler = (error: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof AppError) {
    logger.warn("application_error", {
      code: error.code,
      message: error.message,
      path: req.originalUrl,
      method: req.method,
      details: error.details,
    });
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.flatten(),
      },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const isTransactionTimeout = error.code === "P2028";
    const statusCode = isTransactionTimeout ? 503 : 409;
    const message = isTransactionTimeout
      ? "Temporary transaction timeout. Please retry."
      : "Database constraint violation";

    logger.error("prisma_error", {
      code: error.code,
      message: error.message,
      path: req.originalUrl,
      method: req.method,
    });
    res.status(statusCode).json({
      error: {
        code: "DATABASE_CONFLICT",
        message,
        details: { prismaCode: error.code },
      },
    });
    return;
  }

  const unknownError = error as Error;
  logger.error("unhandled_error", {
    message: unknownError.message,
    stack: unknownError.stack,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error",
    },
  });
};
