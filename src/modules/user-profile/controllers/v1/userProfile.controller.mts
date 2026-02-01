import type { UpdateUserProfileDto } from "@modules/user-profile/dtos/updateProfile.dto.mjs";
import { userProfileService } from "@modules/user-profile/userProfile.service.mjs";
import { AppError } from "@utils";
import type { Request, Response, NextFunction } from "express";

export const userProfileController = {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError("Not authenticated", 401);
      }

      const profile = await userProfileService.getProfile(user.id);
      res.status(200).json({
        ...user.toObject(),
        ...profile,
        userId: undefined,
        __v: undefined,
        _id: undefined,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(
    req: Request<unknown, unknown, UpdateUserProfileDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError("User not found", 404);
      }
      const message = await userProfileService.updateProfile(user.id, req.body);

      res.status(200).json({
        message,
      });
    } catch (error) {
      next(error);
    }
  },
};
