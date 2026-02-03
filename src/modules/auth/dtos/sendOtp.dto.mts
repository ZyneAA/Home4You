import { Channel } from "@modules/otp-code/types/channel.type.mjs";
import { OtpType } from "@modules/otp-code/types/otpType.type.mjs";
import { z } from "zod";

export const sendOtpDtoSchema = z.object({
  body: z.object({
    email: z.email(),
    type: z.enum(OtpType),
    channel: z.enum(Channel),
  }),
});

export type SendOtpDto = z.infer<typeof sendOtpDtoSchema>["body"];
