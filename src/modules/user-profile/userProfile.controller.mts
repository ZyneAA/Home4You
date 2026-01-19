import { AppError } from "@utils";
import type { Request, Response, NextFunction } from "express";

import type { UpdateUserProfileDto } from "./dtos/updateProfile.dto.mjs";
import { userProfileService } from "./userProfile.service.mjs";

export const userProfileController = {
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
