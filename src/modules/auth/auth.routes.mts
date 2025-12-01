import { validateDto } from "@middlewares";
import { protect } from "@middlewares";
import { Router } from "express";

import { authController } from "./auth.controller.mjs";
import { loginDtoSchema } from "./dtos/login.dto.mjs";
import { logoutDtoSchema } from "./dtos/logout.dto.mjs";
import { registerDtoSchema } from "./dtos/register.dto.mjs";

const router = Router();

router.post(
  "/register",
  validateDto(registerDtoSchema),
  authController.register,
);
router.get("/check", protect, authController.check);
router.post("/login", validateDto(loginDtoSchema), authController.login);
router.post("/logout", validateDto(logoutDtoSchema), authController.logout);
router.post("/refresh", authController.refresh);

export const authRoutes = router;
