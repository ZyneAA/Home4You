import argon2 from "argon2";

import { User } from "./user.model.mjs";
import type { IUser } from "./types/user.type.mjs";
import type { CreateUserDto } from "./dtos/create-user.dto.mjs";
import type { UpdateUserDto } from "./dtos/update-user.dto.mjs";
import { AppError } from "@utils";

export const userService = {
  async createUser(userData: CreateUserDto): Promise<IUser> {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError("An account with this email already exists.", 409);
    }

    const passwordHash = await argon2.hash(userData.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 5,
      parallelism: 2,
    });

    const newUser = new User({
      ...userData,
      passwordHash,
    });

    await newUser.save();
    return newUser;
  },

  async getAllUsers(): Promise<IUser[]> {
    return User.find();
  },

  async getUserById(id: string): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  },

  async updateUser(id: string, userData: UpdateUserDto): Promise<IUser> {
    const user = await User.findByIdAndUpdate(id, userData, { new: true });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  },

  async deleteUser(id: string): Promise<void> {
    const result = await User.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new AppError("User not found", 404);
    }
  },
};
