import { z } from "zod";
import { GenderEnum } from "../../common/enums";

export const updateProfileSchema = {
  body: z.strictObject({
    userName: z
      .string({
        error: "Name is required",
      })
      .min(2, {
        error: "Name must be at least 2 characters",
      })
      .optional(),
    phone: z.string().min(11).max(11).optional(),
    profilePic: z.url().optional(),
    profileCoverPic: z.array(z.url()).optional(),
    gender: z.nativeEnum(GenderEnum).optional(),
  }),
};

export const changePasswordSchema = {
  body: z
    .strictObject({
      currentPassword: z.string().min(6, {
        error: "Current password must be at least 6 characters",
      }),
      newPassword: z.string().min(6).max(20),
      confirmPassword: z.string().min(6).max(20),
    })
    .superRefine((data, ctx) => {
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          message: "Passwords do not match",
          path: ["confirmPassword"],
        });
      }
    }),
};

export const userIdParamSchema = {
  params: z.strictObject({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, {
      error: "Invalid user id",
    }),
  }),
};

export const getUsersSchema = {
  query: z.strictObject({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
  }),
};
