import winston from "winston";
import "winston-daily-rotate-file";

const logger = winston.createLogger({
    level: process.env["LOG_LEVEL"] || "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
    ),
    defaultMeta: { service: "home4you-api" },
    transports: [
        new winston.transports.DailyRotateFile({
            filename: "./logs/%DATE%-error.log",
            datePattern: "YYYY-MM-DD",
            level: "error",
            maxSize: "10m",
            maxFiles: "14d",
            zippedArchive: true,
        }),
        new winston.transports.DailyRotateFile({
            filename: "./logs/%DATE%-combined.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "10m",
            maxFiles: "14d",
            zippedArchive: true,
        }),
    ],
});

if (process.env["NODE_ENV"] !== "production") {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
            ),
        }),
    );
}

export default logger;
