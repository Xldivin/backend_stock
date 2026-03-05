import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";
import { apiRouter } from "./routes";

export const app = express();

const normalizeOrigin = (origin: string) => origin.replace(/\/+$/g, "");

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = normalizeOrigin(origin);
    const isExactAllowed = env.corsOrigins.includes(normalizedOrigin);
    const isVercelPreviewAllowed = env.corsOrigins.some(
      (allowedOrigin) =>
        allowedOrigin.startsWith("https://*.vercel.app") &&
        normalizedOrigin.startsWith("https://") &&
        normalizedOrigin.endsWith(".vercel.app"),
    );

    if (isExactAllowed || isVercelPreviewAllowed) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Guest-Id"],
};

app.use(
  cors(corsOptions),
);
app.options("*", cors(corsOptions));

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
