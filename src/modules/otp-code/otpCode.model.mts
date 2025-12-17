import { Schema, model, Types } from "mongoose";

const OtpCodeSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", index: true },

    // Optional link to a pending session if you're doing multi-step login
    authSessionId: { type: Types.ObjectId, ref: "AuthSession" },

    codeHash: { type: String, required: true },

    type: {
      type: String,
      enum: ["LOGIN", "SIGNUP", "PASSWORD_RESET", "PHONE_VERIFY"],
      required: true,
      index: true,
    },

    channel: {
      type: String,
      enum: ["SMS", "EMAIL"],
    },

    expiresAt: { type: Date, index: true },

    usedAt: { type: Date },
    failedAttempts: { type: Number, default: 0 },

    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpCode = model("OtpCode", OtpCodeSchema);
