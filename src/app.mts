// Libs
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";

// Locals
import logger from "./config/logger.mjs";
import { connectDB } from "./config/db.mjs";
import router from "./routes/router.mjs";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    morgan("combined", {
        stream: { write: (message: string) => logger.info(message.trim()) },
    }),
);

// Connect to MongoDB
await connectDB();

// Routes
app.use("/api", router);

app.get("/", (_, res) => {
    logger.info("Test OK");
    res.status(200).send("Welcome");
});

app.get("/health", (_, res) => {
    res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

export default app;
