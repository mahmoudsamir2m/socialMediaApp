import z from "zod";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  signupSchema,
  verifyOtpSchema,
} from "./auth.validation";

export type LoginDTO = z.infer<typeof loginSchema.body>;
export type SignupDTO = z.infer<typeof signupSchema.body>;
export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema.body>;
export type VerifyOtpDTO = z.infer<typeof verifyOtpSchema.body>;
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema.body>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema.body>;
