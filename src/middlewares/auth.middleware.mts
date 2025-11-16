import { User } from "@modules/user";
import { AppError, logger, jwtToken } from "@utils";
import type { Request, Response, NextFunction, RequestHandler } from "express";

export const protect: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Not authorized to access this route", 401));
  }

  try {
    const { userId } = jwtToken.verify(token) as { userId: string };
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 401));
    }

    req.user = user;
    logger.info(user);
    next();
  } catch (error) {
    logger.error(error);
    return next(new AppError("Not authorized to access this route", 401));
  }
};
