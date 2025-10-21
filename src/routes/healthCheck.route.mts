import express from "express";
import mongoose from "mongoose";

import { checkHealth } from "../controllers/healthCheck.mjs";

const router = express.Router();

router.get("/health", checkHealth);

router.get("/readyz", (_req, res) => {
  const isReady = mongoose.connection.readyState === 1;
  if (isReady) {
    return res.status(200).json({ status: "READY" });
  }
  return res.status(503).json({ status: "NOT_READY" });
});

export default router;
