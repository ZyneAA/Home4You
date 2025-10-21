import logger from "./logger.mjs";
import env from "../validations/env.validation.mjs";

type CorsCallback = (err: Error | null, allow?: boolean) => void;
const allowedOrigins: Set<string> = new Set(
  (env.CORS_ORIGINS || "")
    .split(",")
    .map(o => o.trim())
    .filter(Boolean),
);

const corsOptions = {
  origin: (origin: string | undefined, callback: CorsCallback) => {
    // Allow reqs with no Origin header(e.g mobile, cURL, etc)
    if (!origin) {
      return callback(null, true);
    }

    // Checking the allowed origins
    if (allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from unauthorized origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

export default corsOptions;
