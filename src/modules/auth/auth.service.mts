import crypto from "crypto";

import { redisClient, transporter } from "@config";
import { userService, User } from "@modules/user";
import type { IUser } from "@modules/user/types/user.type.mjs";
import { env } from "@shared/validations";
import { jwtToken, logger } from "@utils";
import { AppError } from "@utils";
import argon2 from "argon2";

import { AuthSession } from "./auth.model.mjs";
import type { LoginDto } from "./dtos/login.dto.mjs";
import type { LogoutDto } from "./dtos/logout.dto.mjs";
import type { RegisterDto } from "./dtos/register.dto.mjs";

export const authService = {
  async register(dto: RegisterDto) {
    await userService.createUser(dto);
    const otp = await this.generateOtp(6);
    await this.sendOtp(dto.email, otp);
    await this.updateOtp(dto.email, otp);

    return "OTP has been sent to your email";
  },

  async login(dto: LoginDto) {
    const user = await User.findOne({ email: dto.email }).select(
      "+passwordHash +lockUntil +failedLoginAttempts",
    );
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
      return this.lockAccount(user, undefined);
    }

    const otp = await this.generateOtp(6);
    await this.sendOtp(dto.email, otp);
    await this.updateOtp(dto.email, otp);
    return "OTP has been sent to your email";
  },

  async createSession(
    userId: string,
    ipAddress: string | unknown,
    userAgent: string,
    deviceId: string,
  ) {
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
    });
    await AuthSession.create({
      user: userId,
      tokenHash,
      userAgent,
      ipAddress,
      deviceId,
      expiresAt: new Date(
        Date.now() + env.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      ),
    });

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

  async updateOtp(email: string, otp: string) {
    const user = await User.findOne({
      email,
    }).select("+otp +otpExpire");
    if (!user) {
      throw new AppError("Invalid email", 404);
    }

    const expiary = env.OPT_EXPIARY;
    user.otp = await argon2.hash(otp);
    user.otpExpire = new Date(Date.now() + expiary);
    await user.save();

    return {
      otp,
      expiresAt: user.otpExpire,
    };
  },

  async verifyOtp(
    email: string,
    otp: string,
    ipAddress: string,
    userAgent: string,
    deviceId: string,
  ) {
    const user = await User.findOne({ email }).select("+otp +otpExpire");
    if (!user) {
      throw new AppError("Invalid email", 404);
    }

    if (user.lockUntil && user.lockUntil > new Date(Date.now())) {
      throw new AppError(`Account locked. Try again after sometime`, 423);
    }

    if (!user.otp || !user.otpExpire) {
      return this.lockAccount(user, "Expired Otp");
    }

    if (user.otpExpire.getTime() < Date.now()) {
      return this.lockAccount(user, undefined);
    }

    const isValid = await argon2.verify(user.otp, otp);
    if (!isValid) {
      return this.lockAccount(user, undefined);
    }

    user.otp = undefined;
    user.otpExpire = undefined;
    user.emailVerified = true;

    await user.save();

    const { accessToken, refreshToken } = await this.createSession(
      user.id,
      ipAddress,
      userAgent,
      deviceId,
    );

    return {
      accessToken,
      refreshToken,
      user: user.toJSON(),
    };
  },

  async refresh(
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
    deviceId: string,
  ) {
    const tokenFromDb = await AuthSession.findOne({
      deviceId,
      revokedAt: null,
      expiresAt: { $gt: new Date() }, // Ensure token is active
    })
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
      );
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
    );

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User account no longer exists", 401);
    }

    const newTokens = await this.createSession(
      user.id,
      ipAddress,
      userAgent,
      tokenFromDb.deviceId,
    );

    return newTokens;
  },

  async lockAccount(user: IUser, message: string | undefined) {
    if (user.failedLoginAttempts !== undefined) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= env.FAILED_LOGIN_ATTEMPT) {
        user.lockUntil = new Date(Date.now() + env.ACCOUNT_LOCK_DURATION);
        user.failedLoginAttempts = 0;
      }
    }

    await user.save({ validateBeforeSave: false });
    throw new AppError(message || "Invalid credentials", 401);
  },
};
