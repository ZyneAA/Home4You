import { AppError } from "@utils";
import type { Request, Response, NextFunction } from "express";
import type { ZodObject } from "zod";
import { ZodError } from "zod";

export const validateDto =
  (schema: ZodObject) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorLog = error.issues.map(e => e.message).join("\n");
        next(new AppError(`Validation failed: ${errorLog}`, 400));
      } else {
        next(new AppError("Internal server error", 500));
      }
    }
  };
