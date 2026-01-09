import { validateDto } from "@middlewares";
import { Router } from "express";

import { forgotPasswordDtoSchema } from "./dtos/forgot-password.dto.mjs";
import { resetPasswordDtoSchema } from "./dtos/reset-password.dto.mjs";
import { passwordForgetController } from "./password-forget.controller.mjs";

const router = Router();

router.post(
  "/forgot-password",
  validateDto(forgotPasswordDtoSchema),
  passwordForgetController.forgotPassword,
);

router.post(
  "/reset-password",
  validateDto(resetPasswordDtoSchema),
  passwordForgetController.resetPassword,
);

export const passwordForgetRoutes = router;
