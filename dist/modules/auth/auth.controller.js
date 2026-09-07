"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_service_1 = __importDefault(require("./auth.service"));
const sucsses_response_1 = require("../../common/exceptions/sucsses.response");
const auth_validation_1 = require("./auth.validation");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const applications_exceptions_1 = require("../../common/exceptions/applications.exceptions");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            cb(new applications_exceptions_1.BadRequestException("Only image files are allowed for profile picture"));
            return;
        }
        cb(null, true);
    },
});
const router = (0, express_1.Router)();
router.post("/login", (0, validation_middleware_1.validation)(auth_validation_1.loginSchema), async (req, res) => {
    const data = await auth_service_1.default.login(req.body);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Login success", status: 200, data });
});
router.post("/signup", upload.single("profilePic"), (0, validation_middleware_1.validation)(auth_validation_1.signupSchema), async (req, res) => {
    const data = await auth_service_1.default.signup(req.body, req.file);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Signup success", status: 201, data });
});
router.post("/verify-otp", (0, validation_middleware_1.validation)(auth_validation_1.verifyOtpSchema), async (req, res) => {
    const data = await auth_service_1.default.verifyOtp(req.body);
    return (0, sucsses_response_1.SuccessResponse)({
        res,
        message: "Email verified successfully",
        status: 200,
        data,
    });
});
router.post("/forgot-password", (0, validation_middleware_1.validation)(auth_validation_1.forgotPasswordSchema), async (req, res) => {
    const data = await auth_service_1.default.forgotPassword(req.body);
    return (0, sucsses_response_1.SuccessResponse)({
        res,
        message: "Password reset token sent to your email",
        status: 200,
        data,
    });
});
router.post("/reset-password", (0, validation_middleware_1.validation)(auth_validation_1.resetPasswordSchema), async (req, res) => {
    const data = await auth_service_1.default.resetPassword(req.body);
    return (0, sucsses_response_1.SuccessResponse)({
        res,
        message: "Password reset successfully",
        status: 200,
        data,
    });
});
router.post("/refresh-token", (0, validation_middleware_1.validation)(auth_validation_1.refreshTokenSchema), async (req, res) => {
    const data = await auth_service_1.default.refreshToken(req.body);
    return (0, sucsses_response_1.SuccessResponse)({
        res,
        message: "Token refreshed successfully",
        status: 200,
        data,
    });
});
exports.default = router;
