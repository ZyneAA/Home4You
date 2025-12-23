import type mongoose from "mongoose";

export interface IUserProfile {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  bio: string;
  avatarUrl: string;
  location: {
    city: string;
  };
}
