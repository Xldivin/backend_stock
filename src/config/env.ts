import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 4000))
    .pipe(z.number().int().positive()),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 60_000))
    .pipe(z.number().int().positive()),
  RATE_LIMIT_MAX: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 120))
    .pipe(z.number().int().positive()),
  RESERVATION_EXPIRY_MINUTES: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 5))
    .pipe(z.number().int().positive()),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  throw new Error(`Invalid environment variables: ${message}`);
}

const normalizeOrigin = (origin: string) =>
  origin
    .trim()
    .replace(/^"+|"+$/g, "")
    .replace(/\/+$/g, "");

const corsOrigins = parsed.data.CORS_ORIGIN.split(",")
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

export const env = {
  ...parsed.data,
  corsOrigins,
  rateLimitWindowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: parsed.data.RATE_LIMIT_MAX,
};
