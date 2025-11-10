import mongoose from "mongoose";

import { logger } from "@utils";
import { env } from "@shared/validations";

export const connectDB = async (): Promise<void> => {
  const DATABASE_URL = env.DATABASE_URL;

  try {
    const connect = await mongoose.connect(DATABASE_URL, {
      maxPoolSize: env.NODE_ENV === "production" ? env.MONGO_MAX_POOL_SIZE : 10,
      minPoolSize: env.NODE_ENV === "production" ? env.MONGO_MIN_POOL_SIZE : 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      retryWrites: true,
      retryReads: true,
      compressors: ["zlib"],
      heartbeatFrequencyMS: 10000,
    });
    logger.info(`MongoDB connected to ${connect.connection.host}`);

    // --- RESILIENCE ---
    const db = mongoose.connection;

    db.on("error", err => {
      logger.error(`Mongoose runtime error: ${err.message}`);
    });

    db.on("disconnected", () => {
      logger.warn("Mongoose disconnected! Attempting to auto-reconnect...");
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
