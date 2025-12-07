import { authUserRateLimit, globalRateLimit } from "@middlewares";
import express from "express";

import { authRoutes } from "./auth/index.mjs";
import { healthCheckRoutes } from "./health/index.mjs";
import { userRoutes } from "./user/user.routes.mjs";

const router = express.Router();

router.use("/sys", globalRateLimit, healthCheckRoutes);
router.use("/user", authUserRateLimit, userRoutes);
router.use("/auth", globalRateLimit, authRoutes);

export default router;
