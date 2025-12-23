import { Schema, model } from "mongoose";

import type { IUserProfile } from "./types/userProfile.types.mjs";

const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: { type: Schema.ObjectId, ref: "User", unique: true, index: true },

    fullName: { type: String },
    bio: { type: String },
    avatarUrl: { type: String },

    location: {
      city: String,
    },
  },
  { timestamps: true },
);

export const UserProfile = model("UserProfile", UserProfileSchema);
