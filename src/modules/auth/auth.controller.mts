import type { Request, Response, NextFunction } from "express";

import { authService } from "./auth.service.mjs";
import type { LoginDto } from "./dtos/login.dto.mjs";
import type { LogoutDto } from "./dtos/logout.dto.mjs";
import type { RefreshDto } from "./dtos/refresh.dto.mjs";
import type { RegisterDto } from "./dtos/register.dto.mjs";
import type { SendOtpDto } from "./dtos/sendOtp.dto.mjs";
import type { VerifyOtpDto } from "./dtos/verifyOtp.dto.mjs";
import { otpCodeService } from "@modules/otp-code/otpCode.service.mjs";

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
    req: Request<unknown, unknown, RegisterDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const message = await authService.register(req.body);

      res.status(201).json({
        message,
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
      const message = await authService.login(req.body);

      res.status(200).json({ message });
    } catch (error) {
      next(error);
    }
  },

  async logout(
    req: Request<unknown, unknown, LogoutDto>,
    res: Response,
    next: NextFunction,
  ) {
    let accessToken;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      accessToken = req.headers.authorization.split(" ")[1];
    }
    if (!accessToken) {
      res.status(401).json({ message: "Access Token not found" });
      return;
    }

    try {
      await authService.logout(req.body, accessToken);
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

  async verifyOtp(
    req: Request<unknown, unknown, VerifyOtpDto>,
    res: Response,
    next: NextFunction,
  ) {
    const rawIp = req.headers["x-forwarded-for"] || req.ip || undefined;
    const ip = cleanIp(normalizeIp(rawIp));
    const userAgent = req.headers["user-agent"] || "unknown";

    try {
      const { refreshToken, accessToken, user } = await otpCodeService.verifyOtp(
        req.body.email,
        req.body.otp,
        ip,
        userAgent,
        req.body.deviceId,
      );
      res.status(200).json({
        accessToken,
        refreshToken,
        user,
      });
    } catch (e) {
      next(e);
    }
  },

  async resendOtp(
    req: Request<unknown, unknown, SendOtpDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await otpCodeService.resendOtp(req.body.email);
      res.status(200).json({ message: "OTP has been sent" });
    } catch (e) {
      next(e);
    }
  },

  async check(req: Request, res: Response, _next: NextFunction) {
    res.status(200).json({ user: req.user });
  },
};
