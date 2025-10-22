import type { Request, Response } from "express";

import env from "../validations/env.validation.mjs";

const cookie = {
  getOption: (): object => ({
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  }),
  set: (res: Response, name: string, value: string, options = {}) => {
    res.cookie(name, value, { ...cookie.getOption(), ...options });
  },
  get: (req: Request, name: string) => req.cookies[name],
  clear: (res: Response, name: string, options = {}) => {
    res.clearCookie(name, { ...cookie.getOption(), ...options });
  },
};

export default cookie;
