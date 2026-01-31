import { authUserRateLimit, globalRateLimit, protect } from "@middlewares";
import express from "express";

import { authRoutes } from "./auth/index.mjs";
import { healthCheckRoutes } from "./health/index.mjs";
import { passwordForgetRoutes } from "./password-forget/index.mjs";
import { userRoutes } from "./user/user.routes.mjs";
import { userProfileRoutes } from "./user-profile/userProfile.routes.mjs";

const router = express.Router();

router.use("/sys", globalRateLimit, healthCheckRoutes);
router.use("/user", authUserRateLimit, userRoutes);
router.use("/auth", globalRateLimit, authRoutes);
router.use(protect, authUserRateLimit, userProfileRoutes);
router.use(globalRateLimit, passwordForgetRoutes);

export default router;
