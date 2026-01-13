import { describe, it, expect, afterEach, vi } from "vitest";

import { passwordForgetService } from "../../../modules/password-forget/password-forget.service.mts";
import { User } from "../../../modules/user/user.model.mts";
import { OtpCode } from "../../../modules/otp-code/otpCode.model.mts";
import { otpCodeService } from "../../../modules/otp-code/otpCode.service.mts";
import { AppError } from "../../../utils/appError.mts";
import { OtpType } from "../../../modules/otp-code/types/otpType.type.mts";

vi.mock("@utils", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("../../../modules/user/user.model.mts", () => ({
  User: {
    findOne: vi.fn(),
  },
}));

vi.mock("../../../modules/otp-code/otpCode.model.mts", () => ({
  OtpCode: {
    findOne: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock("../../../modules/otp-code/otpCode.service.mts", () => ({
  otpCodeService: {
    generateOtp: vi.fn(),
    createAndSetOtp: vi.fn(),
    sendOtp: vi.fn(),
  },
}));

vi.mock("mongoose", async () => {
  const actual = await vi.importActual("mongoose");
  return {
    ...actual,
    startSession: vi.fn(() => ({
      withTransaction: vi.fn(async (fn: () => Promise<void>) => {
        await fn();
      }),
      inTransaction: vi.fn(() => false),
      abortTransaction: vi.fn(),
      endSession: vi.fn(),
    })),
  };
});

describe("PasswordForgetService", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("forgotPassword", () => {
    it("should send OTP for password reset when user exists", async () => {
      const dto = {
        email: "test@example.com",
      };

      const mockUser = {
        id: "user-id-123",
        email: dto.email,
      };

      const mockOtp = "123456";

      (User.findOne as any).mockResolvedValue(mockUser);
      (otpCodeService.generateOtp as any).mockResolvedValue(mockOtp);
      (otpCodeService.createAndSetOtp as any).mockResolvedValue({});
      (otpCodeService.sendOtp as any).mockResolvedValue(undefined);

      const result = await passwordForgetService.forgotPassword(dto);

      expect(User.findOne).toHaveBeenCalled();
      expect(otpCodeService.generateOtp).toHaveBeenCalledWith(6);
      expect(otpCodeService.createAndSetOtp).toHaveBeenCalled();
      expect(otpCodeService.sendOtp).toHaveBeenCalledWith(dto.email, mockOtp);
      expect(result).toBe("An OTP has been sent to your email");
    });

    it("should return success message even if user does not exist (security)", async () => {
      const dto = {
        email: "nonexistent@example.com",
      };

      (User.findOne as any).mockResolvedValue(null);

      const result = await passwordForgetService.forgotPassword(dto);

      expect(User.findOne).toHaveBeenCalled();
      expect(otpCodeService.generateOtp).not.toHaveBeenCalled();
      expect(result).toBe("An OTP has been sent to your email");
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully with valid OTP", async () => {
      const dto = {
        email: "test@example.com",
        otp: "123456",
        newPassword: "NewPassword123@",
      };

      const mockUser = {
        id: "user-id-123",
        email: dto.email,
        passwordHash: "old-hash",
        lockUntil: null,
        setPassword: vi.fn(),
        save: vi.fn(),
      };

      const mockOtpCode = {
        _id: "otp-id-123",
        userId: mockUser.id,
        codeHash: "hashed-otp",
        expiresAt: new Date(Date.now() + 60000),
        type: OtpType.PASSWORD_RESET,
      };

      const argon2 = await import("argon2");

      (User.findOne as any).mockResolvedValue(mockUser);
      (OtpCode.findOne as any).mockResolvedValue(mockOtpCode);
      (argon2.default.verify as any).mockResolvedValue(true);
      (OtpCode.deleteOne as any).mockResolvedValue({});

      const result = await passwordForgetService.resetPassword(dto);

      expect(User.findOne).toHaveBeenCalled();
      expect(OtpCode.findOne).toHaveBeenCalled();
      expect(argon2.default.verify).toHaveBeenCalled();
      expect(mockUser.setPassword).toHaveBeenCalledWith(dto.newPassword);
      expect(mockUser.save).toHaveBeenCalled();
      expect(OtpCode.deleteOne).toHaveBeenCalled();
      expect(result).toBe("Password has been reset successfully");
    });

    it("should throw error if user does not exist", async () => {
      const dto = {
        email: "nonexistent@example.com",
        otp: "123456",
        newPassword: "NewPassword123@",
      };

      (User.findOne as any).mockResolvedValue(null);

      await expect(passwordForgetService.resetPassword(dto)).rejects.toThrow(
        "Invalid email or OTP",
      );
    });

    it("should throw error if account is locked", async () => {
      const dto = {
        email: "test@example.com",
        otp: "123456",
        newPassword: "NewPassword123@",
      };

      const mockUser = {
        id: "user-id-123",
        email: dto.email,
        lockUntil: new Date(Date.now() + 60000),
      };

      (User.findOne as any).mockResolvedValue(mockUser);

      await expect(passwordForgetService.resetPassword(dto)).rejects.toThrow(
        "Account locked. Try again after sometime",
      );
    });

    it("should throw error if OTP does not exist", async () => {
      const dto = {
        email: "test@example.com",
        otp: "123456",
        newPassword: "NewPassword123@",
      };

      const mockUser = {
        id: "user-id-123",
        email: dto.email,
        lockUntil: null,
      };

      (User.findOne as any).mockResolvedValue(mockUser);
      (OtpCode.findOne as any).mockResolvedValue(null);

      await expect(passwordForgetService.resetPassword(dto)).rejects.toThrow(
        "Invalid email or OTP",
      );
    });

    it("should throw error if OTP has expired", async () => {
      const dto = {
        email: "test@example.com",
        otp: "123456",
        newPassword: "NewPassword123@",
      };

      const mockUser = {
        id: "user-id-123",
        email: dto.email,
        lockUntil: null,
      };

      const mockOtpCode = {
        _id: "otp-id-123",
        userId: mockUser.id,
        expiresAt: new Date(Date.now() - 60000),
      };

      (User.findOne as any).mockResolvedValue(mockUser);
      (OtpCode.findOne as any).mockResolvedValue(mockOtpCode);
      (OtpCode.deleteOne as any).mockResolvedValue({});

      await expect(passwordForgetService.resetPassword(dto)).rejects.toThrow(
        "OTP has expired. Please request a new one",
      );
      expect(OtpCode.deleteOne).toHaveBeenCalled();
    });

    it("should throw error if OTP is invalid", async () => {
      const dto = {
        email: "test@example.com",
        otp: "wrong-otp",
        newPassword: "NewPassword123@",
      };

      const mockUser = {
        id: "user-id-123",
        email: dto.email,
        lockUntil: null,
      };

      const mockOtpCode = {
        _id: "otp-id-123",
        userId: mockUser.id,
        codeHash: "hashed-otp",
        expiresAt: new Date(Date.now() + 60000),
      };

      const argon2 = await import("argon2");

      (User.findOne as any).mockResolvedValue(mockUser);
      (OtpCode.findOne as any).mockResolvedValue(mockOtpCode);
      (argon2.default.verify as any).mockResolvedValue(false);

      await expect(passwordForgetService.resetPassword(dto)).rejects.toThrow(
        "Invalid email or OTP",
      );
    });
  });
});
