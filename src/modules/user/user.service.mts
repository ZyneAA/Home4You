import { AppError } from "@utils";
import type { ClientSession } from "mongoose";

import type { CreateUserDto } from "./dtos/create-user.dto.mjs";
import type { UpdateUserDto } from "./dtos/update-user.dto.mjs";
import type { IUser } from "./types/user.type.mjs";
import { User } from "./user.model.mjs";
import mongoose from "mongoose";

export const userService = {
  async createUser(
    userData: CreateUserDto,
    session: ClientSession,
  ): Promise<IUser> {
    const existingUser = await User.findOne({ email: userData.email }).session(
      session,
    );
    if (existingUser) {
      throw new AppError("An account with this email already exists.", 409);
    }

    const newUser = new User(
      {
        _id: new mongoose.Types.ObjectId(),
        fullName: userData.fullName,
        email: userData.email,
      },
      { session },
    );
    console.log(newUser);

    await newUser.setPassword(userData.password);

    await newUser.save({ session });

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
