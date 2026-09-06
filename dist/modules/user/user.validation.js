"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersSchema = exports.userIdParamSchema = exports.changePasswordSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../common/enums");
exports.updateProfileSchema = {
    body: zod_1.z.strictObject({
        userName: zod_1.z
            .string({
            error: "Name is required",
        })
            .min(2, {
            error: "Name must be at least 2 characters",
        })
            .optional(),
        phone: zod_1.z.string().min(11).max(11).optional(),
        profilePic: zod_1.z.url().optional(),
        profileCoverPic: zod_1.z.array(zod_1.z.url()).optional(),
        gender: zod_1.z.nativeEnum(enums_1.GenderEnum).optional(),
    }),
};
exports.changePasswordSchema = {
    body: zod_1.z
        .strictObject({
        currentPassword: zod_1.z.string().min(6, {
            error: "Current password must be at least 6 characters",
        }),
        newPassword: zod_1.z.string().min(6).max(20),
        confirmPassword: zod_1.z.string().min(6).max(20),
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
exports.userIdParamSchema = {
    params: zod_1.z.strictObject({
        userId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, {
            error: "Invalid user id",
        }),
    }),
};
exports.getUsersSchema = {
    query: zod_1.z.strictObject({
        page: zod_1.z.coerce.number().min(1).default(1),
        limit: zod_1.z.coerce.number().min(1).max(50).default(10),
    }),
};
