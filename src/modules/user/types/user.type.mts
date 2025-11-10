import type mongoose from "mongoose";
import crypto from "crypto";

export interface IUser extends mongoose.Document {
  fullName: string;
  email: string;
  emailVerified: boolean;
  passwordHash?: string;
  verificationTokenHash?: string;
  verificationTokenExpires?: Date;
  resetPasswordTokenHash?: string;
  resetPasswordTokenExpires?: Date;
  failedLoginAttempts?: number;
  lockUntil?: Date | null;
  roles: string[];
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;

  isLocked(): boolean;
  setPassword(password: string): Promise<void>;
  comparePassword(password: string): Promise<boolean>;
  generateVerificationToken(ttlMs?: number): Promise<string>;
  generatePasswordResetToken(ttlMs?: number): Promise<string>;
}

export interface ICreateUser {
  fullName: string;
  email: string;
  password: string;
}

export function createTokenHash(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}
