import morgan from "morgan";
import type express from "express";

import { logger } from "@utils";

morgan.token("id", (req: express.Request) => req.id || "-");
export const morganMiddleware = morgan(
  ":id :method :url :status :res[content-length] - :response-time ms",
  {
    stream: {
      write: (msg: string) => logger.info(msg.trim()),
    },
    skip: req => req.url === "/api/health",
  },
);
