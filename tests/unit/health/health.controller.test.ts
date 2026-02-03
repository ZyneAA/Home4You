import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { redisClient } from "../../../src/config/redis.mts";

import {
  checkHealth,
  getRedisStatus,
} from "../../../src/modules/health/health.controller.mts";

vi.mock("../../../src/utils/index.mts", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("../../../src/config/index.mts", () => ({
  redisClient: {
    isOpen: false,
    options: {
      socket: {
        connectTimeout: 5000,
      },
    },
  },
}));

describe("HealthController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getRedisStatus", () => {
    it("should return 'disconnected' if redis is not open", async () => {
      (redisClient as any).isOpen = false;

      const status = await getRedisStatus();

      expect(status).toContain("disconnected");
    });
  });

  describe("checkHealth", () => {
    it("should return healthy status when all dependencies are connected", async () => {
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      // Mock mongoose connection
      Object.defineProperty(mongoose.connection, "readyState", {
        value: 1, // connected
        writable: true,
        configurable: true,
      });

      (redisClient as any).isOpen = true;

      await checkHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "OK",
          dependencies: expect.objectContaining({
            mongo: "connected",
          }),
        }),
      );
    });

    it("should return error status when mongo is disconnected", async () => {
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      // Mock mongoose connection as disconnected
      Object.defineProperty(mongoose.connection, "readyState", {
        value: 0, // disconnected
        writable: true,
        configurable: true,
      });

      (redisClient as any).isOpen = true;

      await checkHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "ERROR",
          dependencies: expect.objectContaining({
            mongo: "disconnected",
          }),
        }),
      );
    });

    it("should return error status when redis is disconnected", async () => {
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

      (redisClient as any).isOpen = false;

      await checkHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "ERROR",
        }),
      );
    });

    it("should handle errors gracefully", async () => {
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      // Mock mongoose connection to throw error
      Object.defineProperty(mongoose.connection, "readyState", {
        get: () => {
          throw new Error("Connection error");
        },
        configurable: true,
      });

      await checkHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "ERROR",
          error: expect.any(String),
        }),
      );
    });

    it("should return correct mongo status for different states", async () => {
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      (redisClient as any).isOpen = false;

      // Test connecting state
      Object.defineProperty(mongoose.connection, "readyState", {
        value: 2, // connecting
        writable: true,
        configurable: true,
      });

      await checkHealth(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          dependencies: expect.objectContaining({
            mongo: "connecting",
          }),
        }),
      );
    });
  });
});
