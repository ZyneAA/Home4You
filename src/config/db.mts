// Libs
import mongoose from "mongoose";
import "dotenv/config";

// Local
import logger from "./logger.mjs";

export const connectDB = async (): Promise<void> => {
    const DATABASE_URL = process.env["DATABASE_URL"];

    if (DATABASE_URL === undefined) {
        logger.error("DATABASE_URL undefined!");
        process.exit(1);
    }

    try {
        const connect = await mongoose.connect(DATABASE_URL);
        logger.info(`MongoDB connected to ${connect.connection.host}`);

        // --- RESILIENCE ---
        const db = mongoose.connection;

        db.on("error", err => {
            logger.error(`Mongoose runtime error: ${err.message}`);
        });

        db.on("disconnected", () => {
            logger.warn(
                "Mongoose disconnected! Attempting to auto-reconnect...",
            );
        });

        db.on("reconnected", () => {
            logger.info("Mongoose reconnected successfully!");
        });
        // --- END OF RESILIENCE ADDITIONS ---
    } catch (error) {
        logger.error(`Connection failed to MongoDB ${error}`);
        process.exit(1);
    }
};
