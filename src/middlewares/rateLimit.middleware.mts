import type { RequestHandler } from "express";
import env from "../validations/env.validation.mjs";
import redisClient from "../config/redis.mjs";
import AppError from "../config/error.mjs";
import logger from "../config/logger.mjs";

// Sliding window counter
const rateLimit: RequestHandler = async (req, res, next) => {
    const key = `rate_limit:${req.ip}`;
    const now = Date.now();

    const subWindowSizeMs = env.SUB_WINDOW_SIZE * 1000;
    const currentSubWindow = Math.floor(now / subWindowSizeMs);

    try {
        const subWindows = await redisClient.hGetAll(key);

        // Clean up expired sub-windows
        const validThreshold =
            currentSubWindow -
            Math.floor(env.WINDOW_SIZE / env.SUB_WINDOW_SIZE);
        let totalCount = 0;
        const pipeline = redisClient.multi();

        for (const [subWindow, countStr] of Object.entries(subWindows)) {
            const subWindowNum = parseInt(subWindow, 10);
            if (subWindowNum <= validThreshold) {
                pipeline.hDel(key, subWindow);
            } else {
                totalCount += parseInt(countStr, 10);
            }
        }

        if (totalCount >= env.LIMIT) {
            const retryAfter = Math.ceil(env.SUB_WINDOW_SIZE);
            res.setHeader("Retry-After", retryAfter);
            return next(new AppError("Too many requests", 429));
        }

        pipeline.hIncrBy(key, currentSubWindow.toString(), 1);
        pipeline.expire(key, env.WINDOW_SIZE, "NX");

        await pipeline.exec();
        next();
    } catch (err) {
        logger.error("Rate limiter error:", err);
        return next(new AppError("Internal rate limiting error", 500));
    }
};

export default rateLimit;
