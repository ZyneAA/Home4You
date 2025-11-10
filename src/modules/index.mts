import express from "express";

import { healthCheckRoutes } from "./health/index.mjs";
import { userRoutes } from "./user/user.routes.mjs";

const router = express.Router();

router.use(healthCheckRoutes);
router.use(userRoutes);

export default router;
