import { createClient } from "redis";

import env from "../validations/env.validation.mjs";
import logger from "./logger.mjs";

const redisClient = createClient({
    url: env.REDIS_URL,
    socket: {
        reconnectStrategy: retries => {
            const delay = Math.min(retries * 100, 3000); // capped exponential backoff
            logger.warn(
                `Redis reconnect attempt #${retries}, retrying in ${delay}ms`,
            );
            return delay;
        },
    },
});

(async () => {
    try {
        await redisClient.connect();
        logger.info("Redis client initialized successfully");
    } catch (err) {
        logger.error("Failed to connect to Redis:", err);
        process.exit(1); // fail fast
    }
})();

export default redisClient;
