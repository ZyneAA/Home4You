import { z } from "zod";
import "dotenv/config";

import logger from "../config/logger.mjs";

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
    MONGO_MAX_POOL_SIZE: z
        .string()
        .regex(/^\d+$/)
        .transform(Number)
        .default(10),
    MONGO_MIN_POOL_SIZE: z.string().regex(/^\d+$/).transform(Number).default(2),

    // Redis related
    REDIS_URL: z.string().min(1, "DATABASE_URL is required"),
    LIMIT: z.string().regex(/^\d+$/).transform(Number).default(100),
    WINDOW_SIZE: z.string().regex(/^\d+$/).transform(Number).default(15),
    SUB_WINDOW_SIZE: z.string().regex(/^\d+$/).transform(Number).default(5),
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

export default parseResult.data;
