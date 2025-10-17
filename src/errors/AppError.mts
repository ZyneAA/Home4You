export default class AppError extends Error {
    public readonly statusCode: number;
    public readonly code?: string | undefined;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode = 500, code?: string, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Error.captureStackTrace?.(this, this.constructor);
    }
}


