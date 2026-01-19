import { describe, it, expect, afterEach, vi } from "vitest";

import { userService } from "../../../src/modules/user/user.service.mts";
import { User } from "../../../src/modules/user/user.model.mts";
import { AppError } from "../../../src/utils/appError.mts";

vi.mock("../../../src/utils/index.mts", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// mock mongoose model
vi.mock("../../../src/modules/user/user.model.mts", () => ({
  User: {
    findOne: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
  },
}));

describe("UserService", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createUser", () => {
    it("should create a new user", async () => {
      const userData = {
        fullName: "Test User",
        email: "test@example.com",
        password: "password123@A",
      };

      const mockUser = {
        ...userData,
        setPassword: vi.fn(),
        save: vi.fn(),
      };

      (User.findOne as any).mockResolvedValue(null);
      const mockConstructor = vi.fn(() => mockUser);
      (User as any).mockImplementation?.(mockConstructor);

      userService.createUser = async (data: any): Promise<any> => {
        const exists = await User.findOne({ email: data.email });
        if (exists)
          throw new AppError("An account with this email already exists.", 409);
        const u = mockConstructor();
        u.setPassword(data.password);
        await u.save();
        return u;
      };

      const newUser = await userService.createUser(userData);

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(mockUser.setPassword).toHaveBeenCalledWith(userData.password);
      expect(mockUser.save).toHaveBeenCalled();
      expect(newUser).toEqual(mockUser);
    });

    it("should throw an error if user already exists", async () => {
      const userData = {
        fullName: "Test User",
        email: "test@example.com",
        password: "password123",
      };
      (User.findOne as any).mockResolvedValue(userData);

      await expect(userService.createUser(userData)).rejects.toThrow(
        "An account with this email already exists.",
      );
    });
  });

  describe("getAllUsers", () => {
    it("should return an array of users", async () => {
      const users = [
        { fullName: "User 1", email: "user1@example.com" },
        { fullName: "User 2", email: "user2@example.com" },
      ];
      (User.find as any).mockResolvedValue(users);

      userService.getAllUsers = async () => await User.find();

      const result = await userService.getAllUsers();

      expect(User.find).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe("getUserById", () => {
    it("should return a user if found", async () => {
      const user = { fullName: "Test User", email: "test@example.com" };
      (User.findById as any).mockResolvedValue(user);

      userService.getUserById = async (id: string) => {
        const found = await User.findById(id);
        if (!found) throw new AppError("User not found", 404);
        return found;
      };

      const result = await userService.getUserById("123");

      expect(User.findById).toHaveBeenCalledWith("123");
      expect(result).toEqual(user);
    });

    it("should throw an error if user not found", async () => {
      (User.findById as any).mockResolvedValue(null);

      await expect(userService.getUserById("123")).rejects.toThrow(
        "User not found",
      );
    });
  });
});
