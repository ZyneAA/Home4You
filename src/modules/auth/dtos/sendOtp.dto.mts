import { z } from "zod";

export const sendOtpDtoSchema = z.object({
  body: z.object({
    email: z.email(),
  }),
});

export type SendOtpDto = z.infer<typeof sendOtpDtoSchema>["body"];
