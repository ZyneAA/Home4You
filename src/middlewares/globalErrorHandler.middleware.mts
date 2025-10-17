import type express from "express";
import { ZodError } from "zod";

import logger from "../config/logger.mjs";
import env from "../validations/env.validation.mjs";

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

    if (err instanceof ZodError) {
        statusCode = 400;
        message = "Validation failed";
    } else if (err?.code === 11000) {
        statusCode = 409;
        message = "Duplicate key";
    } else if (err?.name === "CastError") {
        statusCode = 400;
        message = "Invalid identifier";
    } else if (statusCode >= 400 && statusCode < 500) {
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
