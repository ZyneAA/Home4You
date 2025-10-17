import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import corsOptions from "./config/cors.mjs";
import { connectDB } from "./config/db.mjs";
import router from "./routes/router.mjs";
import globalErrorHandler from "./middlewares/globalErrorHandler.middleware.mjs";
import requestId from "./middlewares/requestId.middleware.mjs";
import morganMiddleware from "./middlewares/morgan.middleware.mjs";
import AppError from "./config/error.mjs";

const app = express();

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "same-site" },
        crossOriginOpenerPolicy: { policy: "same-origin" },
    }),
);
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// Basic rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: false,
    legacyHeaders: false,
});

// Connect to MongoDB
await connectDB();

// Router and middlewares
app.use(requestId, morganMiddleware, apiLimiter);
app.use("/api", router);

app.use((req, _res, next) => {
    const err = new AppError(
        `Can't find the endpoint on the server ${req.originalUrl}`,
        404,
        undefined,
        true,
    );
    next(err);
});
app.use(globalErrorHandler);

export default app;
