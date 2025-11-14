import argon2 from "argon2";
import { model, Schema } from "mongoose";
import type { InferSchemaType } from "mongoose";

import type { IUser } from "./types/user.type.mjs";
import { createTokenHash } from "./types/user.type.mjs";

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    passwordHash: { type: String, select: false },
    verificationTokenHash: { type: String, select: false },
    verificationTokenExpires: { type: Date, select: false },
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordTokenExpires: { type: Date, select: false },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    roles: { type: [String], default: ["user"], index: true },
    phone: { type: String, trim: true, sparse: true },
    avatarUrl: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 1024 },
  },
  {
    timestamps: true,
    versionKey: "version",
    optimisticConcurrency: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        // remove sensitive/internal fields when serializing
        delete ret.passwordHash;
        delete ret.verificationTokenHash;
        delete ret.verificationTokenExpires;
        delete ret.resetPasswordTokenHash;
        delete ret.resetPasswordTokenExpires;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        delete ret._id;
        return ret;
      },
    },
  },
);

UserSchema.methods["setPassword"] = async function (
  this: IUser,
  password: string,
): Promise<void> {
  // Argon2 hashing with reasonable defaults, can be tuned
  this.passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
};

UserSchema.methods["comparePassword"] = async function (
  this: IUser,
  candidate: string,
): Promise<boolean> {
  if (!this.passwordHash) {
    return false;
  }
  try {
    return await argon2.verify(this.passwordHash, candidate);
  } catch {
    return false;
  }
};

UserSchema.methods["generateVerificationToken"] = async function (
  this: IUser,
  ttlMs = 24 * 60 * 60 * 1000,
): Promise<string> {
  const { token, hash } = createTokenHash();
  this.verificationTokenHash = hash;
  this.verificationTokenExpires = new Date(Date.now() + ttlMs);
  await this.save();
  return token;
};

UserSchema.methods["generatePasswordResetToken"] = async function (
  this: IUser,
  ttlMs = 60 * 60 * 1000,
) {
  const { token, hash } = createTokenHash();
  this.resetPasswordTokenHash = hash;
  this.resetPasswordTokenExpires = new Date(Date.now() + ttlMs);
  await this.save();
  return token;
};

UserSchema.methods["isLocked"] = function (this: IUser) {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

UserSchema.methods["incrementFailedLogin"] = async function (
  this: IUser,
  maxAttempts = 5,
  lockMs = 15 * 60 * 1000,
) {
  if (this.isLocked()) {
    return;
  }
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  if (this.failedLoginAttempts >= maxAttempts) {
    this.lockUntil = new Date(Date.now() + lockMs);
  }
  await this.save();
};

export type CreatedUser = InferSchemaType<typeof UserSchema>;
export const User = model("User", UserSchema);
