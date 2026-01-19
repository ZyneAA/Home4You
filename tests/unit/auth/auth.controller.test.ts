import { describe, it, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";

import { authController } from "../../../src/modules/auth/auth.controller.mts";
import { authService } from "../../../src/modules/auth/auth.service.mts";
import { otpCodeService } from "../../../src/modules/otp-code/otpCode.service.mts";
import { AppError } from "../../../src/utils/appError.mts";

vi.mock("../../../src/utils/index.mts", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("../../../src/modules/auth/auth.service.mts", () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  },
}));

vi.mock("../../../src/modules/otp-code/otpCode.service.mts", () => ({
  otpCodeService: {
    verifyOtp: vi.fn(),
    resendOtp: vi.fn(),
  },
}));

describe("AuthController", () => {
  describe("register", () => {
    it("should register a new user successfully", async () => {
      const req = {
        body: {
          email: "test@example.com",
          userName: "testuser",
          password: "Password123@",
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
          channel: "EMAIL",
        },
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      (authService.register as any).mockResolvedValue(
        "OTP has been sent to your email",
      );

      await authController.register(req, res, next);

      expect(authService.register).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "OTP has been sent to your email",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle errors during registration", async () => {
      const req = {
        body: {
          email: "test@example.com",
          userName: "testuser",
          password: "Password123@",
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
          channel: "EMAIL",
        },
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      const error = new AppError("Email already exists", 409);
      (authService.register as any).mockRejectedValue(error);

      await authController.register(req, res, next);

      expect(authService.register).toHaveBeenCalledWith(req.body);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("login", () => {
    it("should login successfully", async () => {
      const req = {
        body: {
          email: "test@example.com",
          password: "Password123@",
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
        },
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      (authService.login as any).mockResolvedValue(
        "OTP has been sent to your email",
      );

      await authController.login(req, res, next);

      expect(authService.login).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "OTP has been sent to your email",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should logout successfully with valid access token", async () => {
      const req = {
        body: {
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
          refreshToken: "refresh-token-123",
        },
        headers: {
          authorization: "Bearer access-token-123",
        },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      (authService.logout as any).mockResolvedValue(undefined);

      await authController.logout(req, res, next);

      expect(authService.logout).toHaveBeenCalledWith(
        req.body,
        "access-token-123",
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if access token is missing", async () => {
      const req = {
        body: {
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
          refreshToken: "refresh-token-123",
        },
        headers: { authorization: "Bearer" },
        get: (h: string) => (h === "authorization" ? "Bearer" : undefined),
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await authController.logout(req, res, next);

      expect(authService.logout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Access Token not found",
      });
    });
  });

  describe("refresh", () => {
    it("should refresh tokens successfully", async () => {
      const req = {
        body: {
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
        },
        headers: {
          authorization: "RefreshToken refresh-token-123",
          "x-forwarded-for": "192.168.1.1",
          "user-agent": "test-agent",
        },
        ip: "192.168.1.1",
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      (authService.refresh as any).mockResolvedValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });

      await authController.refresh(req, res, next);

      expect(authService.refresh).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if refresh token is missing", async () => {
      const req = {
        body: {
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
        },
        headers: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await authController.refresh(req, res, next);

      expect(authService.refresh).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Refresh token not found in Authorization header",
      });
    });
  });

  describe("verifyOtp", () => {
    it("should verify OTP successfully", async () => {
      const req = {
        body: {
          email: "test@example.com",
          otp: "123456",
          deviceId: "550e8400-e29b-41d4-a716-446655440000",
        },
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "user-agent": "test-agent",
        },
        ip: "192.168.1.1",
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      (otpCodeService.verifyOtp as any).mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: { id: "user-id", email: "test@example.com" },
      });

      await authController.verifyOtp(req, res, "SIGNUP" as any, next);

      expect(otpCodeService.verifyOtp).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: { id: "user-id", email: "test@example.com" },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("resendOtp", () => {
    it("should resend OTP successfully", async () => {
      const req = {
        body: {
          email: "test@example.com",
          type: "SIGNUP",
          channel: "EMAIL",
        },
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      (otpCodeService.resendOtp as any).mockResolvedValue(undefined);

      await authController.resendOtp(req, res, next);

      expect(otpCodeService.resendOtp).toHaveBeenCalledWith(
        req.body.email,
        req.body.type,
        req.body.channel,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "OTP has been sent",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("check", () => {
    it("should return user from request", async () => {
      const req = {
        user: { id: "user-id", email: "test@example.com" },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await authController.check(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        user: { id: "user-id", email: "test@example.com" },
      });
    });
  });
});
