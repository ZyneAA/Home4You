import crypto from "crypto";

import { userService, User } from "@modules/user";
import { env } from "@shared/validations";
import { jwtToken, logger } from "@utils";
import { AppError } from "@utils";
import argon2 from "argon2";

import { AuthSession } from "./auth.model.mjs";
import type { LoginDto } from "./dtos/login.dto.mjs";
import type { LogoutDto } from "./dtos/logout.dto.mjs";
import type { RegisterDto } from "./dtos/register.dto.mjs";

export const authService = {
  async register(
    dto: RegisterDto,
    ipAddress: string | unknown,
    userAgent: string,
  ) {
    const user = await userService.createUser(dto);
    const { accessToken, refreshToken } = await this.createSession(
      user.id,
      ipAddress,
      userAgent,
      dto.deviceId,
    );

    return {
      accessToken,
      refreshToken,
      user: user.toJSON(),
    };
  },

  async login(dto: LoginDto, ipAddress: string | unknown, userAgent: string) {
    const user = await User.findOne({ email: dto.email }).select(
      "+passwordHash +lockUntil +failedLoginAttempts",
    );
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }
    if (user.lockUntil && user.lockUntil > new Date(Date.now())) {
      // const remaining = Math.ceil((user.lockUntil - new Date(Date.now())) / 1000); // add later
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
      if (user.failedLoginAttempts !== undefined) {
        user.failedLoginAttempts += 1;

        if (user.failedLoginAttempts >= env.FAILED_LOGIN_ATTEMPT) {
          user.lockUntil = new Date(Date.now() + env.ACCOUNT_LOCK_DURATION);
          user.failedLoginAttempts = 0;
        }
      }

      await user.save({ validateBeforeSave: false });
      throw new AppError("Invalid credentials", 401);
    }

    return this.createSession(user.id, ipAddress, userAgent, dto.deviceId);
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

  async logout(dto: LogoutDto) {
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
    }).lean();

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
};
