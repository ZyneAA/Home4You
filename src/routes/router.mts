import express from "express";

import healthCheckRoute from "./healthCheck.route.mjs";
import authRoute from "./auth.route.mjs";
import authCheckRoute from "./authCheck.route.mjs";

const router = express.Router();

router.use(healthCheckRoute);
router.use(authRoute);
router.use(authCheckRoute);

export default router;
