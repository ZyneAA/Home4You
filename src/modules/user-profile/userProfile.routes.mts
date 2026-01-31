import { validateDto } from "@middlewares";
import { Router } from "express";

import { updateProfileDtoSchema } from "./dtos/updateProfile.dto.mjs";
import { userProfileController } from "./userProfile.controller.mjs";

const router = Router();

router
  .route("/me")
  .get(userProfileController.getProfile)
  .patch(
    validateDto(updateProfileDtoSchema),
    userProfileController.updateProfile,
  );

export const userProfileRoutes = router;
