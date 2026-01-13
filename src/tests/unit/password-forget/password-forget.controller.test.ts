import { describe, it, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";

import { passwordForgetController } from "../../../modules/password-forget/password-forget.controller.mts";
import { passwordForgetService } from "../../../modules/password-forget/password-forget.service.mts";
import { AppError } from "../../../utils/appError.mts";

vi.mock("@utils", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("../../../modules/password-forget/password-forget.service.mts", () => ({
  passwordForgetService: {
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

describe("PasswordForgetController", () => {
  describe("forgotPassword", () => {
    it("should send password reset OTP successfully", async () => {
      const req = {
        body: {
          email: "test@example.com",
        },
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      (passwordForgetService.forgotPassword as any).mockResolvedValue(
        "An OTP has been sent to your email",
      );

      await passwordForgetController.forgotPassword(req, res, next);

      expect(passwordForgetService.forgotPassword).toHaveBeenCalledWith(
        req.body,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "An OTP has been sent to your email",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle errors during forgot password", async () => {
      const req = {
        body: {
          email: "test@example.com",
        },
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      const error = new AppError("Database error", 500);
      (passwordForgetService.forgotPassword as any).mockRejectedValue(error);

      await passwordForgetController.forgotPassword(req, res, next);

      expect(passwordForgetService.forgotPassword).toHaveBeenCalledWith(
        req.body,
      );
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      const req = {
        body: {
          email: "test@example.com",
          otp: "123456",
          newPassword: "NewPassword123@",
        },
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      (passwordForgetService.resetPassword as any).mockResolvedValue(
        "Password has been reset successfully",
      );

      await passwordForgetController.resetPassword(req, res, next);

      expect(passwordForgetService.resetPassword).toHaveBeenCalledWith(
        req.body,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Password has been reset successfully",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle errors during password reset", async () => {
      const req = {
        body: {
          email: "test@example.com",
          otp: "123456",
          newPassword: "NewPassword123@",
        },
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      const error = new AppError("Invalid email or OTP", 400);
      (passwordForgetService.resetPassword as any).mockRejectedValue(error);

      await passwordForgetController.resetPassword(req, res, next);

      expect(passwordForgetService.resetPassword).toHaveBeenCalledWith(
        req.body,
      );
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
