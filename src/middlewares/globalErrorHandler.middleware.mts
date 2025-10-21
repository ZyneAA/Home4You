import type express from "express";
import { ZodError } from "zod";

import logger from "../config/logger.mjs";
import env from "../validations/env.validation.mjs";
import AppError from "../config/error.mjs";

/**
 * Global Error Handler Middleware
 */

const globalErrorHandler: express.ErrorRequestHandler = (err, req, res, _) => {
  logger.error(`[Global Error] ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    // Include user ID or other relevant info if available from auth middleware
    // user: req.user?.id
  });

  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = "Internal server error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    if (!err.isOperational) {
      message = "Internal server error";
    }
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
  }
  // MongoDB related
  else if (err instanceof Error && "code" in err && err.code === 11000) {
    statusCode = 409;
    message = "Duplicate key";
  } else if (err instanceof Error && err.name === "CastError") {
    statusCode = 400;
    message = "Invalid identifier";
  }
  // Client side errors
  else if (statusCode >= 400 && statusCode < 500) {
    message = err.message;
  }

  res.status(statusCode).json({
    isSuccess: false,
    status: statusCode,
    message,
    stack: env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default globalErrorHandler;
