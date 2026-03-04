import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";
import { apiRouter } from "./routes";

export const app = express();

app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  }),
);

app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    limit: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);
app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
