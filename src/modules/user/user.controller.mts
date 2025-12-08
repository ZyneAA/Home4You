import type { Request, Response, NextFunction } from "express";

import type {
  UpdateUserDto,
  UpdateUserParams,
} from "./dtos/update-user.dto.mjs";
import { userService } from "./user.service.mjs";

export const userController = {
  async getAllUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json(users.map(u => u.toJSON()));
    } catch (error) {
      next(error);
    }
  },

  async getUserById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.status(200).json(user.toJSON());
    } catch (error) {
      next(error);
    }
  },

  async updateUser(
    req: Request<UpdateUserParams, unknown, UpdateUserDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      res.status(200).json(user.toJSON());
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await userService.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
