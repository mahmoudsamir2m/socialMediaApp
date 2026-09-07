"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const env_service_1 = require("../../config/env.service");
const applications_exceptions_1 = require("../../common/exceptions/applications.exceptions");
const user_model_1 = __importDefault(require("../../database/model/user.model"));
const cloudinary_service_1 = require("../../common/services/cloudinary.service");
class UserService {
    userModel;
    constructor() {
        this.userModel = user_model_1.default;
    }
    async getMe(userId) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new applications_exceptions_1.NotFoundException("User not found");
        }
        return user;
    }
    async getUserById(userId) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new applications_exceptions_1.NotFoundException("User not found");
        }
        return user;
    }
    async getUsers(query) {
        const { page, limit } = query;
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.userModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
            this.userModel.countDocuments(),
        ]);
        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async updateProfile(userId, data, profilePicFile) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new applications_exceptions_1.NotFoundException("User not found");
        }
        if (profilePicFile) {
            const uploadResult = await cloudinary_service_1.cloudinaryService.replaceFile(profilePicFile, user.profilePicPublicId, {
                folder: `users/${user.email}/profile`,
                public_id: `profile-${user._id.toString()}`,
            });
            user.profilePic = uploadResult.secureUrl;
            user.profilePicPublicId = uploadResult.publicId;
        }
        if (data.userName !== undefined) {
            user.set("userName", data.userName);
        }
        if (data.phone !== undefined) {
            user.phone = data.phone;
        }
        if (data.profilePic !== undefined) {
            user.profilePic = data.profilePic;
        }
        if (data.profileCoverPic !== undefined) {
            user.profileCoverPic = data.profileCoverPic;
        }
        if (data.gender !== undefined) {
            user.gender = data.gender;
        }
        await user.save();
        return user;
    }
    async changePassword(userId, data) {
        const user = await this.userModel.findById(userId).select("+password");
        if (!user) {
            throw new applications_exceptions_1.NotFoundException("User not found");
        }
        if (!user.password) {
            throw new applications_exceptions_1.UnauthorizedException("Current password is incorrect");
        }
        const isMatch = await bcrypt_1.default.compare(data.currentPassword, user.password);
        if (!isMatch) {
            throw new applications_exceptions_1.UnauthorizedException("Current password is incorrect");
        }
        if (data.currentPassword === data.newPassword) {
            throw new applications_exceptions_1.BadRequestException("New password must be different from current password");
        }
        user.password = await bcrypt_1.default.hash(data.newPassword, Number(env_service_1.env.salt));
        await user.save();
        return { message: "Password updated successfully" };
    }
    async deleteAccount(userId) {
        const user = await this.userModel.findByIdAndDelete(userId);
        if (!user) {
            throw new applications_exceptions_1.NotFoundException("User not found");
        }
        return { message: "Account deleted successfully" };
    }
}
exports.default = new UserService();
