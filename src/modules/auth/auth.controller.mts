import type { Request, Response, NextFunction } from "express";

import { authService } from "./auth.service.mjs";
import type { AuthSessionDto } from "./dtos/auth.dto.mjs";
import type { LoginDto } from "./dtos/login.dto.mjs";
import type { RefreshDto } from "./dtos/refresh.dto.mjs";

function normalizeIp(ip: string | string[] | undefined): string {
  if (!ip) {
    return "unknown";
  }
  if (Array.isArray(ip)) {
    if (ip[0] === undefined) {
      return "unknown";
    } else {
      return ip[0];
    }
  } else {
    return ip;
  }
}

function cleanIp(ip: string): string {
  if (ip.startsWith("::ffff:")) {
    return ip.replace("::ffff:", "");
  }
  return ip;
}

export const authController = {
  async register(
    req: Request<unknown, unknown, AuthSessionDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const rawIp = req.headers["x-forwarded-for"] || req.ip || undefined;
      const ip = cleanIp(normalizeIp(rawIp));
      const userAgent = req.headers["user-agent"] || "unknown";

      const { user, accessToken, refreshToken } = await authService.register(
        req.body,
        ip,
        userAgent,
      );

      res.status(201).json({
        message: "User created successfully",
        user,
        tokens: { accessToken, refreshToken },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(
    req: Request<unknown, unknown, LoginDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const rawIp = req.headers["x-forwarded-for"] || req.ip || undefined;
      const ip = cleanIp(normalizeIp(rawIp));
      const userAgent = req.headers["user-agent"] || "unknown";

      const { accessToken, refreshToken } = await authService.login(
        req.body,
        ip,
        userAgent,
      );

      res.status(200).json({ accessToken, refreshToken });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.cookies;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async refresh(
    req: Request<unknown, unknown, RefreshDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("RefreshToken ")) {
        res
          .status(401)
          .json({ message: "Refresh token not found in Authorization header" });
        return;
      }
      const refreshToken = authHeader.split(" ")[1];
      if (!refreshToken) {
        res.status(401).json({ message: "Refresh token not found" });
        return;
      } else {
        const rawIp = req.headers["x-forwarded-for"] || req.ip || undefined;
        const ip = cleanIp(normalizeIp(rawIp));
        const userAgent = req.headers["user-agent"] || "unknown";

        const newTokens = await authService.refresh(
          refreshToken,
          ip,
          userAgent,
          req.body.deviceId,
        );
        res.status(200).json({
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
        });
      }
    } catch (error) {
      next(error);
    }
  },

  async check(_req: Request, res: Response, _next: NextFunction) {
    const ok = await authService.check();
    res.status(200).json({ ok });
  },
};
