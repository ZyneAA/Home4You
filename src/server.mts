import mongoose from "mongoose";

import app from "./app.mjs";
import logger from "./config/logger.mjs";
import env from "./validations/env.validation.mjs";

const PORT = env.PORT;

const server = app.listen(PORT, () => {
    logger.info(`Server started on port: ${PORT}`);
});

const shutdown = async (signal: string): Promise<void> => {
    try {
        logger.warn(`Received ${signal}. Shutting down gracefully...`);
        await mongoose.connection.close();
        server.close(() => {
            logger.info("HTTP server closed");
            process.exit(0);
        });
        // Fallback in case close hangs
        setTimeout(() => {
            logger.error("Force exiting after graceful shutdown timeout");
            process.exit(1);
        }, 30000).unref();
    } catch (err) {
        logger.error(`Error during shutdown: ${(err as Error).message}`);
        process.exit(1);
    }
};

["SIGINT", "SIGTERM"].forEach(sig => {
    process.on(sig as NodeJS.Signals, () => shutdown(sig));
});
