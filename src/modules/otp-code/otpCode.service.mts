import crypto from "crypto";

import { redisClient, transporter } from "@config";
import { authService } from "@modules/auth/auth.service.mjs";
import { OtpCode } from "@modules/otp-code/otpCode.model.mjs";
import { User } from "@modules/user/user.model.mjs";
import { env } from "@shared/validations";
import { AppError, logger } from "@utils";
import argon2 from "argon2";
import mongoose, { type ClientSession } from "mongoose";

export const otpCodeService = {
  async generateOtp(length: number): Promise<string> {
    if (length <= 0) {
      throw new Error("Length must be a positive integer.");
    }
    const min = 10 ** (length - 1);
    const max = 10 ** length;
    const numericOtp = crypto.randomInt(min, max);

    return numericOtp.toString();
  },

  async sendOtp(email: string, otp: string): Promise<void> {
    await transporter.sendMail({
      from: `"Home For You" <${env.SMTP_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
      html: `<p>Your OTP is: <b>${otp}</b></p>`,
    });
  },

  async resendOtp(email: string): Promise<string> {
    const session = await mongoose.startSession();

    try {
      const lockSetResult = await redisClient.set(email, "locked", {
        EX: env.OTP_RESEND_WINDOW_SECONDS,
        NX: true,
      });

      if (lockSetResult === null) {
        throw new AppError(`Too many requests. Try again later.`, 429);
      }

      session.startTransaction();
      const user = await User.findOne({ email }).session(session);
      if (!user) {
        throw new AppError("User not found or database error", 500);
      }
      const otp = await this.generateOtp(6);
      await this.createAndSetOtp(user.id, otp, session);
      await this.sendOtp(email, otp);
      await session.commitTransaction();

      return "OTP has been resent.";
    } catch (e) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      logger.error("OTP Request failed:", e);
      throw e instanceof AppError
        ? e
        : new AppError("Could not process OTP request.", 500);
    } finally {
      session.endSession();
    }
  },

  async createAndSetOtp(
    userId: string,
    otp: string,
    session: ClientSession
  ) {
    await OtpCode.deleteMany({ userId }, { session });

    const expiryOffset = env.OPT_EXPIARY;
    const codeHash = await argon2.hash(otp);
    const expiresAt = new Date(Date.now() + expiryOffset);

    await OtpCode.create(
      [{
        userId,
        codeHash,
        expiresAt
      }],
      { session }
    );

    return {
      otp,
      expiresAt
    };
  },

  async otpOperation(userId: string, email: string, session: ClientSession) {
    const otp = await this.generateOtp(6);
    await this.sendOtp(email, otp);
    await this.createAndSetOtp(userId, otp, session);
  },

  async verifyOtp(
    email: string,
    otp: string,
    ipAddress: string,
    userAgent: string,
    deviceId: string,
  ) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const user = await User.findOne({ email })
        .select("+otp +otpExpire")
        .session(session);
      if (!user) {
        throw new AppError("Invalid email", 404);
      }

      if (user.lockUntil && user.lockUntil > new Date(Date.now())) {
        throw new AppError(`Account locked. Try again after sometime`, 423);
      }

      if (!user.otp || !user.otpExpire) {
        await authService.lockAccount(user, session);
        await session.commitTransaction();
        throw new AppError("Invalid credentials", 401);
      }

      let isOtpValid = false;
      if (user.otp && user.otpExpire) {
        if (user.otpExpire.getTime() >= Date.now()) {
          isOtpValid = await argon2.verify(user.otp, otp);
        }
      }

      if (!isOtpValid) {
        await authService.lockAccount(user, session);
        await session.commitTransaction();

        throw new AppError("Invalid credentials", 401);
      }

      user.otp = undefined;
      user.otpExpire = undefined;
      user.emailVerified = true;
      user.failedLoginAttempts = 0;

      await user.save({ session });

      const { accessToken, refreshToken } = await authService.createSession(
        user.id,
        ipAddress,
        userAgent,
        deviceId,
        session,
      );

      await session.commitTransaction();

      return {
        accessToken,
        refreshToken,
        user: user.toJSON(),
      };
    } catch (e) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw e;
    } finally {
      await session.endSession();
    }
  },
};
