// Libs
import express from "express";

// Local
import { checkHealth } from "../controllers/healthCheck.mjs";

const router = express.Router();

router.get("/health", checkHealth);

export default router;
