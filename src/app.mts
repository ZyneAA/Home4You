import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";

import corsOptions from "./config/cors.mjs";
import router from "./routes/router.mjs";
import globalErrorHandler from "./middlewares/globalErrorHandler.middleware.mjs";
import requestId from "./middlewares/requestId.middleware.mjs";
import morganMiddleware from "./middlewares/morgan.middleware.mjs";
import rateLimit from "./middlewares/rateLimit.middleware.mjs";
import AppError from "./config/error.mjs";

const app = express();

app.use(compression()); // Best to use it in reverse proxy
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
app.set("trust proxy", true);

// Router and middlewares
app.use(requestId, morganMiddleware, rateLimit);
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
