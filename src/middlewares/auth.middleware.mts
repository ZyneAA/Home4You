import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";

import { User } from "../models/user.model.mjs";
import AppError from "../config/error.mjs";
import logger from "../config/logger.mjs";
import env from "../validations/env.validation.mjs";

export const protectRoute: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;
    if (!token) {
      return next(new AppError("Unauthorized - No Token Provided", 401));
    }

    // Decode JWT safely
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    if (!decoded?.userId) {
      return next(new AppError("Unauthorized - Invalid Token Payload", 401));
    }

    // Fetch user
    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    //  Fully type-safe access
    req.user = user;
    res.locals["user"] = user;

    next();
  } catch (error) {
    logger.error("Error in protectRoute middleware", { error });
    next(new AppError("Internal server error", 500));
  }
};
