import { AppError } from "@utils";

import type { UpdateUserProfileDto } from "./dtos/updateProfile.dto.mjs";
import { UserProfile } from "./userProfile.model.mjs";

export const userProfileService = {
  async getProfile(userId: string) {
    const profile = UserProfile.findOne({ userId }).lean();
    return profile;
  },

  async updateProfile(userId: string, updatedProfile: UpdateUserProfileDto) {
    const updateData: Partial<UpdateUserProfileDto> = {};

    if (updatedProfile.fullName !== undefined) {
      updateData.fullName = updatedProfile.fullName;
    }

    if (updatedProfile.education !== undefined) {
      updateData.education = updatedProfile.education;
    }

    if (updatedProfile.bio !== undefined) {
      updateData.bio = updatedProfile.bio;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError("No fields to update", 400);
    }

    await UserProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true },
    );

    return "Profile updated successfully";
  },

  async updateProfilePicture() {
    return;
  },
};
