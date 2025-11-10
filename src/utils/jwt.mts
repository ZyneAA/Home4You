import jwt from "jsonwebtoken";

import { env } from "@shared/validations";
import { logger, AppError } from "@utils";

export const jwtToken = {
  sign: (payload: string): string => {
    try {
      return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });
    } catch (err) {
      logger.error("Error signing jwt token: ", err);
      throw new AppError("Failed to authenticate token", 500);
    }
  },
  verify: (token: string) => {
    try {
      return jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      logger.error("Error authenticating jwt token: ", err);
      throw new AppError("Failed to authenticate token", 500);
    }
  },
};
