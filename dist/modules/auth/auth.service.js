"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const env_service_1 = require("../../config/env.service");
const enums_1 = require("../../common/enums");
const applications_exceptions_1 = require("../../common/exceptions/applications.exceptions");
const token_service_1 = require("../../common/services/token.service");
const generateOTP_service_1 = require("../../common/services/generateOTP.service");
const user_model_1 = __importDefault(require("../../database/model/user.model"));
const sendemail_1 = require("../../common/utils/email/sendemail");
const image_service_1 = __importDefault(require("../../common/services/image.service"));
class AuthService {
    userModel;
    tokenService;
    generateOtpService;
    constructor() {
        this.userModel = user_model_1.default;
        this.tokenService = token_service_1.tokenService;
        this.generateOtpService = generateOTP_service_1.generateOtpService;
    }
    async login(data) {
        const user = await this.userModel
            .findOne({ email: data.email })
            .select("+password");
        if (!user) {
            throw new applications_exceptions_1.UnauthorizedException("Invalid email or password");
        }
        if (!user.password) {
            throw new applications_exceptions_1.UnauthorizedException("Invalid email or password");
        }
        const isMatch = await bcrypt_1.default.compare(data.password, user.password);
        if (!isMatch) {
            throw new applications_exceptions_1.UnauthorizedException("Invalid email or password");
        }
        if (!user.confirmEmail) {
            await this.generateOtpService.generate({
                userId: user._id.toString(),
                email: user.email,
                userName: `${user.firstName} ${user.lastName}`,
                subject: "login",
            });
            throw new applications_exceptions_1.ForbiddenException("Please verify your email first");
        }
        const tokens = token_service_1.tokenService.generateTokenPair({
            id: user._id.toString(),
            role: user.role ?? enums_1.RoleEnum.User,
        });
        return { ...tokens, user };
    }
    async refreshToken(data) {
        const payload = token_service_1.tokenService.verifyRefreshToken(data.refreshToken);
        const user = await this.userModel.findById(payload.id);
        if (!user) {
            throw new applications_exceptions_1.UnauthorizedException("Invalid refresh token");
        }
        const tokens = token_service_1.tokenService.refreshTokenPair(data.refreshToken);
        return { ...tokens, user };
    }
    async signup(data, profilePicFile) {
        const existingUser = await this.userModel.findOne({ email: data.email });
        if (existingUser) {
            throw new applications_exceptions_1.ConflictException("Email already exists");
        }
        const { confirmPassword, ...userData } = data;
        const hashedPassword = await bcrypt_1.default.hash(userData.password, Number(env_service_1.env.salt));
        let uploadedProfileImage = null;
        if (profilePicFile) {
            const uploadResult = await image_service_1.default.uploadProfileImage(profilePicFile, data.email);
            uploadedProfileImage = {
                publicId: uploadResult.publicId,
                url: uploadResult.secureUrl,
            };
        }
        const userPayload = {
            ...userData,
            password: hashedPassword,
        };
        if (uploadedProfileImage) {
            userPayload.profilePic = uploadedProfileImage.url;
            userPayload.profilePicPublicId = uploadedProfileImage.publicId;
        }
        const result = await this.userModel.create(userPayload);
        if (!result) {
            throw new applications_exceptions_1.ConflictException("Failed to create user");
        }
        await this.generateOtpService.generate({
            userId: result._id.toString(),
            email: data.email,
            userName: data.userName,
            subject: "signup",
        });
        return result;
    }
    async verifyOtp(data) {
        const user = await this.userModel.findOne({ email: data.email });
        if (!user) {
            throw new applications_exceptions_1.BadRequestException("Invalid email or OTP");
        }
        if (user.confirmEmail) {
            throw new applications_exceptions_1.ConflictException("Email already verified");
        }
        const userId = user._id.toString();
        const otpExists = await this.generateOtpService.exists(userId);
        if (!otpExists) {
            throw new applications_exceptions_1.BadRequestException("OTP expired or invalid");
        }
        const isMatch = await this.generateOtpService.verify({
            userId,
            otp: data.otp,
        });
        if (!isMatch) {
            throw new applications_exceptions_1.BadRequestException("Invalid OTP");
        }
        user.confirmEmail = true;
        await user.save();
        await this.generateOtpService.delete(userId);
        const tokens = this.tokenService.generateTokenPair({
            id: user._id.toString(),
            role: user.role ?? enums_1.RoleEnum.User,
        });
        return { ...tokens, user };
    }
    async forgotPassword(data) {
        const user = await this.userModel.findOne({ email: data.email });
        if (!user) {
            throw new applications_exceptions_1.BadRequestException("User not found");
        }
        const resetToken = await this.generateOtpService.createResetToken(user._id.toString());
        const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
        await (0, sendemail_1.sendEmail)({
            to: user.email,
            subject: "Reset your password",
            html: `
        <h1>Hello ${userName}</h1>
        <p>Your password reset token is:</p>
        <strong>${resetToken}</strong>
        <p>Use this token in the reset-password request.</p>
      `,
        });
        return {
            email: user.email,
            message: "Password reset token sent successfully",
        };
    }
    async resetPassword(data) {
        const user = await this.userModel.findOne({ email: data.email });
        if (!user) {
            throw new applications_exceptions_1.BadRequestException("Invalid email or reset token");
        }
        const isValidToken = await this.generateOtpService.verifyResetToken(user._id.toString(), data.resetToken);
        if (!isValidToken) {
            throw new applications_exceptions_1.BadRequestException("Invalid or expired reset token");
        }
        const hashedPassword = await bcrypt_1.default.hash(data.password, Number(env_service_1.env.salt));
        user.password = hashedPassword;
        await user.save();
        await this.generateOtpService.deleteResetToken(user._id.toString());
        return {
            email: user.email,
        };
    }
}
exports.default = new AuthService();
