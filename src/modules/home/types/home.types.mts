import type mongoose from "mongoose";

export interface IHouse extends mongoose.Document {
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
