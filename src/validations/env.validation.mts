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
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    LOG_LEVEL: z
        .enum(["error", "warn", "info", "http", "verbose", "debug", "silly"])
        .default("info"),
    CORS_ORIGINS: z.string().optional(), // comma-separated list
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
