import { Schema, model, Types } from "mongoose";

const UserProfileSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", unique: true, index: true },

    fullName: { type: String },
    bio: { type: String },
    avatarUrl: { type: String },

    location: {
      city: String,
      country: String,
    },
  },
  { timestamps: true },
);

export const UserProfile = model("UserProfile", UserProfileSchema);
