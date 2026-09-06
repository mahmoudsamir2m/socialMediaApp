import { z } from "zod";

export const signupSchema = {
  body: z
    .strictObject({
      userName: z
        .string({
          error: "Name is required",
        })
        .min(2, {
          error: "Name must be at least 2 characters",
        }),
      email: z.email({
        error: "Invalid email address",
      }),
      phone: z.string().min(11).max(11),
      password: z.string().min(6).max(20),
      confirmPassword: z.string().min(6).max(20),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          message: "Passwords do not match",
          path: ["confirmPassword"],
        });
      }
    }),
};

export const loginSchema = {
  body: z.strictObject({
    email: z.email({
      error: "Invalid email address",
    }),
    password: z.string().min(6, {
      error: "Password must be at least 6 characters",
    }),
  }),
};

export const refreshTokenSchema = {
  body: z.strictObject({
    refreshToken: z.string({
      error: "Refresh token is required",
    }),
  }),
};

export const verifyOtpSchema = {
  body: z.strictObject({
    email: z.email({
      error: "Invalid email address",
    }),
    otp: z
      .string()
      .length(6, {
        error: "OTP must be 6 digits",
      })
      .regex(/^\d+$/, {
        error: "OTP must contain only digits",
      }),
  }),
};

export const forgotPasswordSchema = {
  body: z.strictObject({
    email: z.email({
      error: "Invalid email address",
    }),
  }),
};

export const resetPasswordSchema = {
  body: z
    .strictObject({
      email: z.email({
        error: "Invalid email address",
      }),
      resetToken: z.string({
        error: "Reset token is required",
      }),
      password: z.string().min(6).max(20),
      confirmPassword: z.string().min(6).max(20),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          message: "Passwords do not match",
          path: ["confirmPassword"],
        });
      }
    }),
};
