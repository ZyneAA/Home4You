import type { Request, Response, NextFunction } from "express";

import type { ForgotPasswordDto } from "../dtos/forgot-password.dto.mjs";
import type { ResetPasswordDto } from "../dtos/reset-password.dto.mjs";
import { passwordForgetService } from "../password-forget.service.mjs";

export const passwordForgetController = {
  async forgotPassword(
    req: Request<unknown, unknown, ForgotPasswordDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const message = await passwordForgetService.forgotPassword(req.body);
      res.status(200).json({ message });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(
    req: Request<unknown, unknown, ResetPasswordDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const message = await passwordForgetService.resetPassword(req.body);
      res.status(200).json({ message });
    } catch (error) {
      next(error);
    }
  },
};
