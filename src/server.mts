// Locals
import app from "./app.mjs";
import logger from "./config/logger.mjs";
import mongoose from "mongoose";

const PORT = process.env["PORT"] || 8000;

const server = app.listen(PORT, () => {
    logger.info(`Server started on localhost:${PORT}`);
});

const shutdown = async (signal: string) => {
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
        }, 10000).unref();
    } catch (err) {
        logger.error(`Error during shutdown: ${(err as Error).message}`);
        process.exit(1);
    }
};

["SIGINT", "SIGTERM"].forEach(sig => {
    process.on(sig as NodeJS.Signals, () => shutdown(sig));
});
