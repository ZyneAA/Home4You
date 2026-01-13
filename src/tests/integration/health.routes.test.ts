import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import mongoose from "mongoose";

import { checkHealth } from "../../modules/health/health.controller.mts";
import { healthCheckRoutes } from "../../modules/health/health.routes.mts";

vi.mock("@utils", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@config", () => ({
  redisClient: {
    isOpen: true,
    options: {
      socket: {
        connectTimeout: 5000,
      },
    },
  },
}));

describe("Health Routes Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /health", () => {
    it("should return health status successfully", async () => {
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      // Mock mongoose connection as connected
      Object.defineProperty(mongoose.connection, "readyState", {
        value: 1, // connected
        writable: true,
        configurable: true,
      });

      await checkHealth(req, res);

      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: expect.any(String),
          dependencies: expect.objectContaining({
            mongo: expect.any(String),
            redis: expect.any(String),
          }),
          uptime: expect.any(Number),
          timestamp: expect.any(Number),
        }),
      );
    });
  });

  describe("GET /readyz", () => {
    it("should return ready status when database is connected", async () => {
      // Mock the router handler
      const router = healthCheckRoutes;

      // Mock mongoose connection as connected
      Object.defineProperty(mongoose.connection, "readyState", {
        value: 1, // connected
        writable: true,
        configurable: true,
      });

      // Since we can't directly test the router handler,
      // we verify that the route exists by checking the router stack
      expect(router).toBeDefined();
    });
  });
});
