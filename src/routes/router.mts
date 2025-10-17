import express from "express";

import healthCheckRoute from "./healthCheck.route.mjs";

const router = express.Router();

router.use(healthCheckRoute);

export default router;
