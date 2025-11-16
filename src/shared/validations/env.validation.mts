import { logger } from "@utils";
import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z
    .string()
    .regex(/^\d+$/)
    .default(String(process.env["PORT"] ?? "8000"))
    .transform(Number),
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "http", "verbose", "debug", "silly"])
    .default("info"),
  CORS_ORIGINS: z.string().optional(), // comma-separated list

  // DB related
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  MONGO_MAX_POOL_SIZE: z.string().regex(/^\d+$/).transform(Number).default(10),
  MONGO_MIN_POOL_SIZE: z.string().regex(/^\d+$/).transform(Number).default(2),

  // Redis related
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  LIMIT: z.string().regex(/^\d+$/).transform(Number).default(100),
  WINDOW_SIZE: z.string().regex(/^\d+$/).transform(Number).default(15),
  SUB_WINDOW_SIZE: z.string().regex(/^\d+$/).transform(Number).default(5),

  // JWT
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_SECRET is required"),

  // Auth
  FAILED_LOGIN_ATTEMPT: z.string().regex(/^\d+$/).transform(Number).default(10),
  ACCOUNT_LOCK_DURATION: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default(300000),
  REFRESH_TOKEN_EXPIRY_DAYS: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default(30),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  logger.error("Invalid environment configuration", {
    issues: parseResult.error.issues.map(i => ({
      path: i.path.join("."),
      message: i.message,
    })),
  });
  process.exit(1);
}
logger.info("Environment configuration validated");

export const env = parseResult.data;
