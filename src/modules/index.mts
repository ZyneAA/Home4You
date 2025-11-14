import express from "express";

import { authRoutes } from "./auth/index.mjs";
import { healthCheckRoutes } from "./health/index.mjs";
import { userRoutes } from "./user/user.routes.mjs";

const router = express.Router();

router.use("/sys", healthCheckRoutes);
router.use("/user", userRoutes);
router.use("/auth", authRoutes);

export default router;
