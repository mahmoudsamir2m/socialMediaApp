import bcrypt from "bcrypt";
import type { Model } from "mongoose";
import { env } from "../../config/env.service";
import { RoleEnum } from "../../common/enums";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from "../../common/exceptions/applications.exceptions";
import { tokenService, TokenService } from "../../common/services/token.service";
import {
  generateOtpService,
  GenerateOtpService,
} from "../../common/services/generateOTP.service";
import {
  ForgotPasswordDTO,
  LoginDTO,
  RefreshTokenDTO,
  ResetPasswordDTO,
  SignupDTO,
  VerifyOtpDTO,
} from "./auth.dto";
import { IUser } from "../../common/interfaces";
import UserModel from "../../database/model/user.model";
import { sendEmail } from "../../common/utils/email/sendemail";

class AuthService {
  private userModel: Model<IUser>;
  private tokenService: TokenService;
  private generateOtpService: GenerateOtpService;

  constructor() {
    this.userModel = UserModel;
    this.tokenService = tokenService;
    this.generateOtpService = generateOtpService;
  }

  async login(data: LoginDTO) {
    const user = await this.userModel
      .findOne({ email: data.email })
      .select("+password");

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (!user.confirmEmail) {
      await this.generateOtpService.generate({
        userId: user._id.toString(),
        email: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        subject: "login"
      });
      throw new ForbiddenException("Please verify your email first");
    }

    const tokens = tokenService.generateTokenPair({
      id: user._id.toString(),
      role: user.role ?? RoleEnum.User,
    });

    return { ...tokens, user };
  }

  async refreshToken(data: RefreshTokenDTO) {
    const payload = tokenService.verifyRefreshToken(data.refreshToken);

    const user = await this.userModel.findById(payload.id);
    if (!user) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const tokens = tokenService.refreshTokenPair(data.refreshToken);

    return { ...tokens, user };
  }

  async signup(data: SignupDTO) {
    const existingUser = await this.userModel.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    const { confirmPassword, ...userData } = data;
    const hashedPassword = await bcrypt.hash(
      userData.password,
      Number(env.salt),
    );

    const result = await this.userModel.create({
      ...userData,
      password: hashedPassword,
    });
    if (!result) {
      throw new ConflictException("Failed to create user");
    }
    await this.generateOtpService.generate({
      userId: result._id.toString(),
      email: data.email,
      userName: data.userName,
      subject: "signup",
    });
    return result;
  }

  async verifyOtp(data: VerifyOtpDTO) {
    const user = await this.userModel.findOne({ email: data.email });
    if (!user) {
      throw new BadRequestException("Invalid email or OTP");
    }

    if (user.confirmEmail) {
      throw new ConflictException("Email already verified");
    }

    const userId = user._id.toString();
    const otpExists = await this.generateOtpService.exists(userId);
    if (!otpExists) {
      throw new BadRequestException("OTP expired or invalid");
    }

    const isMatch = await this.generateOtpService.verify({
      userId,
      otp: data.otp,
    });
    if (!isMatch) {
      throw new BadRequestException("Invalid OTP");
    }

    user.confirmEmail = true;
    await user.save();
    await this.generateOtpService.delete(userId);

    const tokens = this.tokenService.generateTokenPair({
      id: user._id.toString(),
      role: user.role ?? RoleEnum.User,
    });

    return { ...tokens, user };
  }

  async forgotPassword(data: ForgotPasswordDTO) {
    const user = await this.userModel.findOne({ email: data.email });
    if (!user) {
      throw new BadRequestException("User not found");
    }

    const resetToken = await this.generateOtpService.createResetToken(
      user._id.toString(),
    );

    const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

    await sendEmail({
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

  async resetPassword(data: ResetPasswordDTO) {
    const user = await this.userModel.findOne({ email: data.email });
    if (!user) {
      throw new BadRequestException("Invalid email or reset token");
    }

    const isValidToken = await this.generateOtpService.verifyResetToken(
      user._id.toString(),
      data.resetToken,
    );

    if (!isValidToken) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    const hashedPassword = await bcrypt.hash(data.password, Number(env.salt));
    user.password = hashedPassword;
    await user.save();
    await this.generateOtpService.deleteResetToken(user._id.toString());

    return {
      email: user.email,
    };
  }
}

export default new AuthService();
