// routes/protected.ts
import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.mjs";

const router = express.Router();

router.get("/protected", protectRoute, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

export default router;
