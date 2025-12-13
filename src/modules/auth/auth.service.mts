import crypto from "crypto";

import { redisClient, transporter } from "@config";
import { userService, User } from "@modules/user";
import type { IUser } from "@modules/user/types/user.type.mjs";
import { env } from "@shared/validations";
import { jwtToken, logger } from "@utils";
import { AppError } from "@utils";
import argon2 from "argon2";
import mongoose, { type ClientSession } from "mongoose";

import { AuthSession } from "./auth.model.mjs";
import type { LoginDto } from "./dtos/login.dto.mjs";
import type { LogoutDto } from "./dtos/logout.dto.mjs";
import type { RegisterDto } from "./dtos/register.dto.mjs";

export const authService = {
  async register(dto: RegisterDto) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // get user from the code below make it usable with updateOpt()
      await userService.createUser(dto, session);
      const otp = await this.generateOtp(6);
      await this.updateOtp(dto.email, otp, session);
      await session.commitTransaction();

      await this.sendOtp(dto.email, otp);

      return "OTP has been sent to your email";
    } catch (e) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw e;
    } finally {
      await session.endSession();
    }
  },

  async login(dto: LoginDto) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();
      const user = await User.findOne({ email: dto.email })
        .select("+passwordHash +lockUntil +failedLoginAttempts")
        .session(session);
      if (!user) {
        throw new AppError("Invalid credentials", 401);
      }
      if (user.lockUntil && user.lockUntil > new Date(Date.now())) {
        throw new AppError(`Account locked. Try again after sometime`, 423);
      }

      if (!user.passwordHash) {
        logger.error("Issue with password hash");
        throw new Error("Issue with user's password");
      }

      const isPasswordValid = await argon2.verify(
        user.passwordHash,
        dto.password,
      );

      if (!isPasswordValid) {
        await this.lockAccount(user, session);
        await session.commitTransaction();
        throw new AppError("Invalid credentials", 401);
      }

      const otp = await this.generateOtp(6);
      await this.updateOtp(dto.email, otp, session);
      await session.commitTransaction();

      await this.sendOtp(dto.email, otp);

      return "OTP has been sent to your email";
    } catch (e) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw e;
    } finally {
      await session.endSession();
    }
  },

  async createSession(
    userId: string,
    ipAddress: string | unknown,
    userAgent: string,
    deviceId: string,
    session: ClientSession,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = jwtToken.sign(userId);

    let refreshToken: string;
    try {
      refreshToken = crypto.randomBytes(32).toString("hex");
    } catch (err: any) {
      throw new AppError(err.message, 500);
    }

    const tokenHash = await argon2.hash(refreshToken);

    await AuthSession.deleteOne({
      user: userId,
      deviceId,
    }).session(session);
    await AuthSession.create(
      [
        {
          user: userId,
          tokenHash,
          userAgent,
          ipAddress,
          deviceId,
          expiresAt: new Date(
            Date.now() + env.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
          ),
        },
      ],
      { session },
    );

    return { accessToken, refreshToken };
  },

  async logout(dto: LogoutDto, accessToken: string) {
    const { jti, exp } = jwtToken.verify(accessToken) as {
      jti: string;
      exp: number;
    };
    const ttlSeconds = Math.floor((exp - Date.now()) / 1000);
    if (ttlSeconds > 0) {
      await redisClient.set(jti, "blacklisted_jti", {
        expiration: { type: "EX", value: ttlSeconds },
      });
    }

    const tokenFromDb = await AuthSession.findOne({
      deviceId: dto.deviceId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).select("+tokenHash");

    if (!tokenFromDb) {
      logger.info(
        `Logout attempt failed: Session for device ${dto.deviceId} not found or inactive.`,
      );
      return;
    }

    const isValid = await argon2.verify(
      tokenFromDb.tokenHash,
      dto.refreshToken,
    );

    if (!isValid) {
      logger.warn(
        `Logout failed for user ${tokenFromDb.user}: Token mismatch for device ${dto.deviceId}.`,
      );
      throw new AppError("Invalid credentials provided for logout.", 401);
    }

    await AuthSession.updateOne(
      { _id: tokenFromDb._id },
      { revokedAt: new Date(), revokedReason: "MANUAL_LOGOUT" },
    );
  },

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
      await this.updateOtp(email, otp, session);
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

  async updateOtp(email: string, otp: string, session: ClientSession) {
    const user = await User.findOne({
      email,
    })
      .select("+otp +otpExpire")
      .session(session);

    if (!user) {
      throw new AppError("Invalid email", 404);
    }

    const expiary = env.OPT_EXPIARY;
    user.otp = await argon2.hash(otp);
    user.otpExpire = new Date(Date.now() + expiary);

    await user.save({ session });

    return {
      otp,
      expiresAt: user.otpExpire,
    };
  },

  async otpOperation(email: string, session: ClientSession) {
    const otp = await this.generateOtp(6);
    await this.sendOtp(email, otp);
    await this.updateOtp(email, otp, session);
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
        await this.lockAccount(user, session);
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
        await this.lockAccount(user, session);
        await session.commitTransaction();

        throw new AppError("Invalid credentials", 401);
      }

      user.otp = undefined;
      user.otpExpire = undefined;
      user.emailVerified = true;
      user.failedLoginAttempts = 0;

      await user.save({ session });

      const { accessToken, refreshToken } = await this.createSession(
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

  async refresh(
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
    deviceId: string,
  ) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const tokenFromDb = await AuthSession.findOne({
        deviceId,
        revokedAt: null,
        expiresAt: { $gt: new Date() }, // Ensure token is active
      })
        .session(session)
        .lean()
        .select("+tokenHash");

      if (!tokenFromDb) {
        throw new AppError("Invalid or expired refresh token", 401);
      }

      const userId = tokenFromDb.user.toString();

      const isValid = await argon2.verify(tokenFromDb.tokenHash, refreshToken);
      if (!isValid) {
        await AuthSession.updateMany(
          { user: userId },
          { revokedAt: new Date(), revokedReason: "TOKEN_REUSE_DETECTED" },
          { session },
        );
        await session.commitTransaction();

        logger.error(
          `Token reuse/mismatch detected for user ${userId}. Device: ${deviceId}. All sessions revoked.`,
        );
        throw new AppError("Invalid refresh token (Session Terminated)", 401);
      }

      if (
        tokenFromDb.ipAddress !== ipAddress ||
        tokenFromDb.userAgent !== userAgent
      ) {
        logger.warn(
          `Session detail changed during refresh for user ${userId}. Device: ${deviceId}. New IP: ${ipAddress}`,
        );
        // warn, but allow rotation for mobile apps (users change IP/network frequently).
      }

      await AuthSession.updateOne(
        { _id: tokenFromDb._id },
        { revokedAt: new Date(), revokedReason: "ROTATED" },
        { session },
      );

      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new AppError("User account no longer exists", 401);
      }

      const newTokens = await this.createSession(
        user.id,
        ipAddress,
        userAgent,
        tokenFromDb.deviceId,
        session,
      );

      await session.commitTransaction();

      return newTokens;
    } catch (e) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw e;
    } finally {
      await session.endSession();
    }
  },

  async lockAccount(user: IUser, session: ClientSession) {
    if (user.failedLoginAttempts !== undefined) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= env.FAILED_LOGIN_ATTEMPT) {
        user.lockUntil = new Date(Date.now() + env.ACCOUNT_LOCK_DURATION);
        user.failedLoginAttempts = 0;
      }
    }

    await user.save({ validateBeforeSave: false, session });
  },
};
