import type mongoose from "mongoose";

export interface IAuthSession {
  user: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  revokedReason: string | null;
  ipAddress: string;
  deviceId: string;
  userAgent: string;
}
