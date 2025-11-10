import { z } from "zod";

export const createUserDtoSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("A valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
});

export type CreateUserDto = z.infer<typeof createUserDtoSchema>["body"];
