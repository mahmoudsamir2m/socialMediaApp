"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.verifyOtpSchema = exports.refreshTokenSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
exports.signupSchema = {
    body: zod_1.z
        .strictObject({
        userName: zod_1.z
            .string({
            error: "Name is required",
        })
            .min(2, {
            error: "Name must be at least 2 characters",
        }),
        email: zod_1.z.email({
            error: "Invalid email address",
        }),
        phone: zod_1.z.string().min(11).max(11),
        password: zod_1.z.string().min(6).max(20),
        confirmPassword: zod_1.z.string().min(6).max(20),
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
exports.loginSchema = {
    body: zod_1.z.strictObject({
        email: zod_1.z.email({
            error: "Invalid email address",
        }),
        password: zod_1.z.string().min(6, {
            error: "Password must be at least 6 characters",
        }),
    }),
};
exports.refreshTokenSchema = {
    body: zod_1.z.strictObject({
        refreshToken: zod_1.z.string({
            error: "Refresh token is required",
        }),
    }),
};
exports.verifyOtpSchema = {
    body: zod_1.z.strictObject({
        email: zod_1.z.email({
            error: "Invalid email address",
        }),
        otp: zod_1.z
            .string()
            .length(6, {
            error: "OTP must be 6 digits",
        })
            .regex(/^\d+$/, {
            error: "OTP must contain only digits",
        }),
    }),
};
exports.forgotPasswordSchema = {
    body: zod_1.z.strictObject({
        email: zod_1.z.email({
            error: "Invalid email address",
        }),
    }),
};
exports.resetPasswordSchema = {
    body: zod_1.z
        .strictObject({
        email: zod_1.z.email({
            error: "Invalid email address",
        }),
        resetToken: zod_1.z.string({
            error: "Reset token is required",
        }),
        password: zod_1.z.string().min(6).max(20),
        confirmPassword: zod_1.z.string().min(6).max(20),
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
