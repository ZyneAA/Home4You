// Libs
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";

// Locals
import logger from "./config/logger.mjs";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    morgan("combined", {
        stream: { write: (message: string) => logger.info(message.trim()) },
    })
);

app.get("/", (_, res) => {
    logger.info("Heeeeeee");
    res.status(200).send("Ok");
});

export default app;
