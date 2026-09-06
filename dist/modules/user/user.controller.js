"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_service_1 = __importDefault(require("./user.service"));
const sucsses_response_1 = require("../../common/exceptions/sucsses.response");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const user_validation_1 = require("./user.validation");
const router = (0, express_1.Router)();
router.get("/me", auth_middleware_1.authMiddleware, async (req, res) => {
    const data = await user_service_1.default.getMe(req.user.id);
    return (0, sucsses_response_1.SuccessResponse)({
        res,
        message: "Profile fetched",
        status: 200,
        data,
    });
});
router.patch("/me", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)(user_validation_1.updateProfileSchema), async (req, res) => {
    const data = await user_service_1.default.updateProfile(req.user.id, req.body);
    return (0, sucsses_response_1.SuccessResponse)({
        res,
        message: "Profile updated",
        status: 200,
        data,
    });
});
router.patch("/me/password", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)(user_validation_1.changePasswordSchema), async (req, res) => {
    const data = await user_service_1.default.changePassword(req.user.id, req.body);
    return (0, sucsses_response_1.SuccessResponse)({
        res,
        message: "Password updated",
        status: 200,
        data,
    });
});
router.delete("/me", auth_middleware_1.authMiddleware, async (req, res) => {
    const data = await user_service_1.default.deleteAccount(req.user.id);
    return (0, sucsses_response_1.SuccessResponse)({
        res,
        message: "Account deleted",
        status: 200,
        data,
    });
});
router.get("/", (0, validation_middleware_1.validation)(user_validation_1.getUsersSchema), async (req, res) => {
    const query = user_validation_1.getUsersSchema.query.parse(req.query);
    const data = await user_service_1.default.getUsers(query);
    return (0, sucsses_response_1.SuccessResponse)({
        res,
        message: "Users fetched",
        status: 200,
        data,
    });
});
router.get("/:userId", (0, validation_middleware_1.validation)(user_validation_1.userIdParamSchema), async (req, res) => {
    const data = await user_service_1.default.getUserById(req.params.userId);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "User fetched", status: 200, data });
});
exports.default = router;
