import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";

import { validateDto } from "../../src/middlewares/validation.middleware.mts";
import { forgotPasswordDtoSchema } from "../../src/modules/password-forget/dtos/forgot-password.dto.mts";
import { resetPasswordDtoSchema } from "../../src/modules/password-forget/dtos/reset-password.dto.mts";
import { passwordForgetRoutes } from "../../src/modules/password-forget/password-forget.routes.mts";
import { AppError } from "../../src/utils/appError.mts";

vi.mock("../../src/utils/index.mts", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock(
  "../../src/modules/password-forget/password-forget.service.mts",
  () => ({
    passwordForgetService: {
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    },
  }),
);

describe("Password Forget Routes Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /forgot-password", () => {
    it("should validate forgot password request with valid email", async () => {
      const req = {
        body: {
          email: "test@example.com",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(forgotPasswordDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject forgot password request with invalid email", async () => {
      const req = {
        body: {
          email: "invalid-email",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(forgotPasswordDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
        }),
      );
    });

    it("should reject forgot password request with missing email", async () => {
      const req = {
        body: {},
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(forgotPasswordDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
        }),
      );
    });
  });

  describe("POST /reset-password", () => {
    it("should validate reset password request with valid data", async () => {
      const req = {
        body: {
          email: "test@example.com",
          otp: "123456",
          newPassword: "NewPassword123@",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(resetPasswordDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it("should reject reset password request with invalid email", async () => {
      const req = {
        body: {
          email: "invalid-email",
          otp: "123456",
          newPassword: "NewPassword123@",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(resetPasswordDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
        }),
      );
    });

    it("should reject reset password request with invalid OTP format", async () => {
      const req = {
        body: {
          email: "test@example.com",
          otp: "123", // Invalid: must be 6 characters
          newPassword: "NewPassword123@",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(resetPasswordDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
        }),
      );
    });

    it("should reject reset password request with weak password", async () => {
      const req = {
        body: {
          email: "test@example.com",
          otp: "123456",
          newPassword: "weak",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(resetPasswordDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
        }),
      );
    });
  });

  describe("Route definitions", () => {
    it("should have password forget routes defined", () => {
      expect(passwordForgetRoutes).toBeDefined();
    });
  });
});
