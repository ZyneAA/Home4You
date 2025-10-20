import "./validations/env.validation.mjs"; // Validate environment first

import { connectDB } from "./config/db.mjs";
import redisClient from "./config/redis.mjs";
import logger from "./config/logger.mjs";
import "./server.mjs";

async function startApp() {
    try {
        await connectDB();

        if (!redisClient.isOpen) {
            await redisClient.connect();
        }

        logger.info("All dependencies initialized. Starting server...");
    } catch (err) {
        logger.error("App startup failed:", err);
        process.exit(1);
    }
}

startApp();

