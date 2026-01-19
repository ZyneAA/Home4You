import { describe, it, expect, afterEach, vi } from "vitest";

import { otpCodeService } from "../../../src/modules/otp-code/otpCode.service.mts";
import { transporter } from "../../../src/config/mailer.mts";
import { AppError } from "../../../src/utils/appError.mts";

vi.mock("../../../src/utils/index.mts", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("../../../src/config/index.mts", () => ({
  transporter: {
    sendMail: vi.fn(),
  },
  redisClient: {
    set: vi.fn(),
  },
}));

vi.mock("../../../src/modules/otp-code/otpCode.model.mts", () => ({
  OtpCode: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock("../../../src/modules/user/user.model.mts", () => ({
  User: {
    findOne: vi.fn(),
  },
}));

vi.mock("mongoose", async () => {
  const actual = await vi.importActual("mongoose");
  return {
    ...actual,
    startSession: vi.fn(() => ({
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn(),
      inTransaction: vi.fn(() => false),
      endSession: vi.fn(),
    })),
  };
});

describe("OtpCodeService", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("generateOtp", () => {
    it("should generate a 6-digit OTP", async () => {
      const otp = await otpCodeService.generateOtp(6);
      expect(otp).toMatch(/^\d{6}$/);
      expect(otp.length).toBe(6);
    });

    it("should generate OTPs of different lengths", async () => {
      const otp4 = await otpCodeService.generateOtp(4);
      expect(otp4).toMatch(/^\d{4}$/);
      expect(otp4.length).toBe(4);

      const otp8 = await otpCodeService.generateOtp(8);
      expect(otp8).toMatch(/^\d{8}$/);
      expect(otp8.length).toBe(8);
    });

    it("should throw error for invalid length", async () => {
      await expect(otpCodeService.generateOtp(0)).rejects.toThrow(
        "Length must be a positive integer.",
      );

      await expect(otpCodeService.generateOtp(-1)).rejects.toThrow(
        "Length must be a positive integer.",
      );
    });
  });

  describe("sendOtp", () => {
    it("should send OTP via email", async () => {
      const email = "test@example.com";
      const otp = "123456";

      (transporter.sendMail as any).mockResolvedValue(undefined);

      await otpCodeService.sendOtp(email, otp);

      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: "Your OTP Code",
          text: `Your OTP is: ${otp}`,
          html: expect.stringContaining(otp),
        }),
      );
    });
  });
});
