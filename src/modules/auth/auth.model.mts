import { Schema, model } from "mongoose";

import type { IAuthSession } from "./types/authSession.type.mjs";

const AuthSessionSchema = new Schema<IAuthSession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedReason: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

export const AuthSession = model<IAuthSession>(
  "AuthSession",
  AuthSessionSchema,
);
