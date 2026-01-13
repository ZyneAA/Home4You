import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";

import { validateDto } from "../../middlewares/validation.middleware.mts";
import { updateUserDtoSchema } from "../../modules/user/dtos/update-user.dto.mts";
import { userRoutes } from "../../modules/user/user.routes.mts";
import { AppError } from "../../utils/appError.mts";

vi.mock("@utils", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("../../modules/user/user.service.mts", () => ({
  userService: {
    getUserById: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

describe("User Routes Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH /:id", () => {
    it("should validate update user request with valid data", async () => {
      const req = {
        body: {
          fullName: "Updated Name",
          email: "updated@example.com",
        },
        query: {},
        params: {
          id: "user-id-123",
        },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(updateUserDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it("should reject update user request with invalid email", async () => {
      const req = {
        body: {
          fullName: "Updated Name",
          email: "invalid-email",
        },
        query: {},
        params: {
          id: "user-id-123",
        },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(updateUserDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
        }),
      );
    });
  });

  describe("Route definitions", () => {
    it("should have user routes defined", () => {
      expect(userRoutes).toBeDefined();
    });
  });
});
