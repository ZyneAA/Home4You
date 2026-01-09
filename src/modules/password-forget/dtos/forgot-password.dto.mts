import { z } from "zod";

export const forgotPasswordDtoSchema = z.object({
  body: z.object({
    email: z.email(),
  }),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordDtoSchema>["body"];
