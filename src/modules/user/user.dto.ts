import z from "zod";
import {
  changePasswordSchema,
  getUsersSchema,
  updateProfileSchema,
} from "./user.validation";

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema.body>;
export type ChangePasswordDTO = z.infer<typeof changePasswordSchema.body>;
export type GetUsersQueryDTO = z.infer<typeof getUsersSchema.query>;
