import { z } from "zod";

export const updateProfileDtoSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(2, "Full name must be atleat 2 characters")
      .optional(),
    education: z.string().optional(),
    bio: z.string().optional(),
  }),
});

export type UpdateUserProfileDto = z.infer<
  typeof updateProfileDtoSchema
>["body"];
