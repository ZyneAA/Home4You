// Libs
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

// Locals
import logger from "./config/logger.mjs";
import corsOptions from "./config/cors.mjs";
import { connectDB } from "./config/db.mjs";
import router from "./routes/router.mjs";
import globalErrorHandler from "./middlewares/globalErrorHandler.middleware.mjs";

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(
    morgan("combined", {
        stream: { write: (message: string) => logger.info(message.trim()) },
    }),
);

// Basic rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use("/api", apiLimiter);

// Connect to MongoDB
await connectDB();

// Routes
app.use("/api", router);

app.get("/", (_, res) => {
    logger.info("Test OK");
    res.status(200).send("Welcome");
});

app.use((req, res, next) => {
    const err = Error(
        `Can't find the route on the server /api/${req.originalUrl}`,
    );
    res.status(404);
    next(err);
});

// Global error handler
app.use(globalErrorHandler);

export default app;
