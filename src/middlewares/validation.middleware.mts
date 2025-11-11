import type { Request, Response, NextFunction } from "express";
import type { ZodObject } from "zod";
import { ZodError } from "zod";
import { AppError } from "@utils";

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
        const errorMessages = error.issues
          .map(issue => ({
            message: `${issue.path.join(".")} is ${issue.message.toLowerCase()}`,
          }))
          .join(", ");
        next(new AppError("Validation failed", 400, errorMessages));
      } else {
        next(new AppError("Internal server error", 500));
      }
    }
  };
