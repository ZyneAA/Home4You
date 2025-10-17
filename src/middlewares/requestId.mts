import type { RequestHandler } from "express";
import { randomUUID } from "crypto";

declare module "express-serve-static-core" {
    interface Request {
        id?: string;
    }
}

const requestId: RequestHandler = (req, res, next) => {
    const incoming = req.headers["x-request-id"];
    const id = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();
    req.id = id;
    res.setHeader("X-Request-Id", id);
    res.locals["requestId"] = id;
    next();
};

export default requestId;

