import type { RequestHandler } from "express";
import { ZodError, type ZodSchema } from "zod";

type Schemas = {
    body?: ZodSchema<any>;
    query?: ZodSchema<any>;
    params?: ZodSchema<any>;
};

const validate = (schemas: Schemas): RequestHandler => {
    return (req, _res, next) => {
        try {
            if (schemas.body) req.body = schemas.body.parse(req.body);
            if (schemas.query) req.query = schemas.query.parse(req.query);
            if (schemas.params) req.params = schemas.params.parse(req.params);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                // Attach 400 and pass to global handler
                (err as any).statusCode = 400;
            }
            next(err);
        }
    };
};

export default validate;


