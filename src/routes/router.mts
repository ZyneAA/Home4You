import express from "express";

import healthCheckRoute from "./healthCheck.route.mjs";
import authRoute from "./auth.route.mjs";

const router = express.Router();

router.use(healthCheckRoute);
router.use(authRoute);

export default router;
