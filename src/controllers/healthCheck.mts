import type { Request, Response } from "express";
import mongoose from "mongoose";

import redisClient from "../config/redis.mjs";

export const checkHealth = async (_: Request, res: Response): Promise<void> => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: "OK",
    dependencies: {
      mongo: "unknown",
      redis: "unknown",
    },
  };

  try {
    const mongoState = mongoose.connection.readyState;
    health.dependencies.mongo =
      mongoState === 1
        ? "connected"
        : mongoState === 2
          ? "connecting"
          : "disconnected";

    if (redisClient.isOpen) {
      try {
        await redisClient.ping();
        health.dependencies.redis = "connected";
      } catch {
        health.dependencies.redis = "error";
      }
    } else {
      health.dependencies.redis = "disconnected";
    }

    const allHealthy = Object.values(health.dependencies).every(
      s => s === "connected",
    );
    health.status = allHealthy ? "ok" : "error";

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (err) {
    health.status = "error";
    res.status(503).json({
      ...health,
      error: (err as Error).message,
    });
  }
};
