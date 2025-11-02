import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().min(2).max(255).trim(),
  email: z.email().max(255).trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be at most 128 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;/']/,
      "Password must contain at least one special character",
    ),
  role: z.enum(["user", "admin"]).default("user"),
});

export const siginSchema = z.object({
  email: z.email().max(255).trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be at most 128 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;/']/,
      "Password must contain at least one special character",
    ),
});
