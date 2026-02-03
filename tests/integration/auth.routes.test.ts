import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";

import { validateDto } from "../../src/middlewares/validation.middleware.mts";
import { loginDtoSchema } from "../../src/modules/auth/dtos/login.dto.mts";
import { registerDtoSchema } from "../../src/modules/auth/dtos/register.dto.mts";
import { verifyOtpDtoSchema } from "../../src/modules/auth/dtos/verifyOtp.dto.mts";
import { sendOtpDtoSchema } from "../../src/modules/auth/dtos/sendOtp.dto.mts";
import { logoutDtoSchema } from "../../src/modules/auth/dtos/logout.dto.mts";
import { refreshDtoSchema } from "../../src/modules/auth/dtos/refresh.dto.mts";
import { authRoutes } from "../../src/modules/auth/auth.routes.mts";
import { AppError } from "../../src/utils/appError.mts";

vi.mock("../../src/utils/logger.mts", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  jwtToken: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

vi.mock("../../src/modules/auth/auth.service.mts", () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  },
}));

vi.mock("../../src/modules/otp-code/otpCode.service.mts", () => ({
  otpCodeService: {
    verifyOtp: vi.fn(),
    resendOtp: vi.fn(),
  },
}));

describe("Auth Routes Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /register", () => {
    it("should validate register request with valid data", async () => {
      const req = {
        body: {
          email: "test@example.com",
          userName: "testuser",
          password: "Password123@",
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
          channel: "EMAIL",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(registerDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject register request with invalid email", async () => {
      const req = {
        body: {
          email: "invalid-email",
          userName: "testuser",
          password: "Password123@",
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
          channel: "EMAIL",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(registerDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
        }),
      );
    });

    it("should reject register request with invalid password", async () => {
      const req = {
        body: {
          email: "test@example.com",
          userName: "testuser",
          password: "weak",
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
          channel: "EMAIL",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(registerDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
        }),
      );
    });
  });

  describe("POST /login", () => {
    it("should validate login request with valid data", async () => {
      const req = {
        body: {
          email: "test@example.com",
          password: "Password123@",
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(loginDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it("should reject login request with invalid credentials", async () => {
      const req = {
        body: {
          email: "invalid-email",
          password: "Password123@",
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(loginDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
        }),
      );
    });
  });

  describe("POST /verify-login-otp", () => {
    it("should validate verify OTP request with valid data", async () => {
      const req = {
        body: {
          email: "test@example.com",
          otp: "123456",
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(verifyOtpDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it("should reject verify OTP request with invalid OTP format", async () => {
      const req = {
        body: {
          email: "test@example.com",
          otp: "123", // Invalid: must be 6 characters
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(verifyOtpDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
        }),
      );
    });
  });

  describe("POST /send-otp", () => {
    it("should validate send OTP request with valid data", async () => {
      const req = {
        body: {
          email: "test@example.com",
          type: "LOGIN",
          channel: "EMAIL",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(sendOtpDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("POST /logout", () => {
    it("should validate logout request with valid data", async () => {
      const req = {
        body: {
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
          refreshToken: "refresh-token-123",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(logoutDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it("should reject logout request with invalid device ID", async () => {
      const req = {
        body: {
          deviceId: "invalid-device-id",
          refreshToken: "refresh-token-123",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(logoutDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
        }),
      );
    });
  });

  describe("POST /refresh", () => {
    it("should validate refresh request with valid data", async () => {
      const req = {
        body: {
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
        },
        query: {},
        params: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validateDto(refreshDtoSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("Route definitions", () => {
    it("should have auth routes defined", () => {
      expect(authRoutes).toBeDefined();
    });
  });
});
