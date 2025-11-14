import crypto from "crypto";

import type mongoose from "mongoose";

/**
 * Interface for a Home document stored in MongoDB
 */
export interface IHome extends mongoose.Document {
  price: string;
  location: string;
  city: string;
  coord: {
    lat: number;
    lng: number;
  };
  type: "sale" | "rent";
  photo_urls: string[];
  area?: string;
  accessTokenHash?: string;
  listedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  setAccessToken(token: string): Promise<void>;
  verifyAccessToken(candidate: string): Promise<boolean>;
}

/**
 * Interface for creating a new Home (input type)
 */
export interface ICreateHome {
  price: string;
  location: string;
  city: string;
  coord: {
    lat: number;
    lng: number;
  };
  type: "sale" | "rent";
  photo_urls?: string[];
  area?: string;
  listedBy: string; // user ID as string when creating
}

/**
 * Utility function to create a random token + hash pair
 * (you can reuse this for secure access tokens, etc.)
 */
export function createTokenHash(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}
