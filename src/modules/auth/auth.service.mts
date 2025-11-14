import crypto from "crypto";

import { userService, User } from "@modules/user";
import { jwtToken, logger } from "@utils";
import { AppError } from "@utils";
import argon2 from "argon2";

import { AuthSession } from "./auth.model.mjs";
import type { AuthSessionDto } from "./dtos/auth.dto.mjs";
import type { LoginDto } from "./dtos/login.dto.mjs";

export const authService = {
  async register(
    dto: AuthSessionDto,
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

        if (user.failedLoginAttempts >= 10) {
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
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
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken };
  },

  async logout(refreshToken: string) {
    await AuthSession.deleteOne({ token: refreshToken });
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

  async check() {
    return argon2.verify(
      "$argon2id$v=19$m=65536,t=3,p=4$PGiUkWYEoKYkCXzMDFfWMg$FBu//KPAy4ocVCV9rpMDFAHYM6nt4IEznMOEZIVUwWc",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTE1NmMzZjc5NTdlYjhlNzk2NGY1NmEiLCJpYXQiOjE3NjMwMTE2NDcsImV4cCI6MTc2NTYwMzY0Nywic3ViIjoiNjkxNTZjM2Y3OTU3ZWI4ZTc5NjRmNTZhIn0.Zjn9xViffUU6-eI-TIHFBZKsM8p7diCyJA9V1okXID4",
    );
  },
};
