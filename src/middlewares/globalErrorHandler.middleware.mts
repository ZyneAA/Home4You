// Libs
import type express from "express";

// Local
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

    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    const isClientError = statusCode >= 400 && statusCode < 500;

    res.status(statusCode).json({
        isSuccess: false,
        status: statusCode,
        message: isClientError ? err.message : "Internal server error",
        stack: env.NODE_ENV === "development" ? err.stack : undefined,
    });
};

export default globalErrorHandler;
