import { authUserRateLimit, globalRateLimit, protect } from "@middlewares";
import { v1AuthRoutes } from "@modules/auth/index.mjs";
import { v1HealthRoutes } from "@modules/health/index.mjs";
import { v1passwordForgetRoutes } from "@modules/password-forget/index.mjs";
import { v1UserRoutes } from "@modules/user/index.mjs";
import { v1UserProfileRoutes } from "@modules/user-profile/index.mjs";
import express from "express";

export const routerV1 = express.Router();
// public
routerV1.use("/sys", globalRateLimit, v1HealthRoutes);
routerV1.use("/auth", globalRateLimit, v1AuthRoutes);
routerV1.use(globalRateLimit, v1passwordForgetRoutes);

// protected
routerV1.use("/user", protect, authUserRateLimit, v1UserRoutes);
routerV1.use("/me", protect, authUserRateLimit, v1UserProfileRoutes);
