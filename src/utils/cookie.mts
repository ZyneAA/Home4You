import { env } from "@shared/validations";
import type { Request, Response } from "express";

export const getOptions = (): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict";
  maxAge: number;
} => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 15 * 60 * 1000, // 15 minutes
});

export const cookie = {
  set: (res: Response, name: string, value: string, options = {}): void => {
    res.cookie(name, value, { ...getOptions(), ...options });
  },
  get: (req: Request, name: string): void => req.cookies[name],
  clear: (res: Response, name: string, options = {}): void => {
    res.clearCookie(name, { ...getOptions(), ...options });
  },
};
