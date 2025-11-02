import type { NextFunction, Request, Response } from "express";

import type { ICreateUser } from "../types/user.type.mjs";
import logger from "../config/logger.mjs";
import { signupSchema } from "../validations/auth.validation.mjs";
import type { CreatedUser } from "../models/user.model.mjs";
import AppError from "../config/error.mjs";
import formatValidationError from "../util/format.mjs";

export const signup = async (
  req: Request<ICreateUser>,
  res: Response<CreatedUser | void>,
  next: NextFunction,
): Promise<void> => {
  try {
    const validationResult = signupSchema.safeParse(req.body);
    if (!validationResult.success) {
      next(new AppError(formatValidationError(validationResult.error), 400));
    } else {
      res.status(201);
      logger.info("User registered successfully");
    }
  } catch (err) {
    const e = "Error in auth.controller.signup";
    logger.error(e, err);

    next(new AppError(e, 500));
  }
};

