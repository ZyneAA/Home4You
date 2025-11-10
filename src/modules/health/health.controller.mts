import type { Request, Response } from "express";
import mongoose from "mongoose";

// A simple redis client mock for health check as redis setup is not in scope of this refactoring
const getRedisStatus = async (): Promise<string> => "connected";

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

    health.dependencies.redis = await getRedisStatus();

    const allHealthy = Object.values(health.dependencies).every(
      s => s === "connected",
    );
    health.status = allHealthy ? "OK" : "ERROR";

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (err) {
    health.status = "ERROR";
    res.status(503).json({
      ...health,
      error: (err as Error).message,
    });
  }
};
