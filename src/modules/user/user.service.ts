import bcrypt from "bcrypt";
import type { Model } from "mongoose";
import { env } from "../../config/env.service";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../../common/exceptions/applications.exceptions";
import { IUser } from "../../common/interfaces";
import UserModel from "../../database/model/user.model";
import type {
  ChangePasswordDTO,
  GetUsersQueryDTO,
  UpdateProfileDTO,
} from "./user.dto";
import { cloudinaryService } from "../../common/services/cloudinary.service";

class UserService {
  private userModel: Model<IUser>;

  constructor() {
    this.userModel = UserModel;
  }

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async getUsers(query: GetUsersQueryDTO) {
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

  async updateProfile(
    userId: string,
    data: UpdateProfileDTO,
    profilePicFile?: Express.Multer.File,
  ) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (profilePicFile) {
      const uploadResult = await cloudinaryService.replaceFile(
        profilePicFile,
        user.profilePicPublicId,
        {
          folder: `users/${user.email}/profile`,
          public_id: `profile-${user._id.toString()}`,
        },
      );

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

  async changePassword(userId: string, data: ChangePasswordDTO) {
    const user = await this.userModel.findById(userId).select("+password");

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!user.password) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    if (data.currentPassword === data.newPassword) {
      throw new BadRequestException(
        "New password must be different from current password",
      );
    }

    user.password = await bcrypt.hash(data.newPassword, Number(env.salt));
    await user.save();

    return { message: "Password updated successfully" };
  }

  async deleteAccount(userId: string) {
    const user = await this.userModel.findByIdAndDelete(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return { message: "Account deleted successfully" };
  }
}

export default new UserService();
