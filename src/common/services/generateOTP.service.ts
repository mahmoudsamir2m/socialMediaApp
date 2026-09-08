import bcrypt from "bcrypt";
import { env } from "../../config/env.service";
import { sendEmail } from "../utils/email/sendemail";
import { RedisService, redisService } from "./redis.service";

const OTP_TTL_SECONDS = 600;

type OtpPurpose = "verify" | "reset";

type GenerateOtpParams = {
  userId: string;
  email: string;
  userName?: string;
  subject?: string;
  html?: (code: string) => string;
  force?: boolean;
  purpose?: OtpPurpose;
};

type VerifyOtpParams = {
  userId: string;
  otp: string;
  purpose?: OtpPurpose;
};

export class GenerateOtpService {
  constructor(private readonly redis: RedisService = redisService) {}

  otpKey(userId: string, purpose: OtpPurpose = "verify") {
    return purpose === "verify"
      ? `otp::${userId}`
      : `otp::${purpose}::${userId}`;
  }

  resetTokenKey(userId: string) {
    return `reset-token::${userId}`;
  }

  async generate({
    userId,
    email,
    userName,
    subject = "OTP verification",
    html,
    force = false,
    purpose = "verify",
  }: GenerateOtpParams): Promise<boolean> {
    if (!force && (await this.exists(userId, purpose))) {
      return false;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const hashOtp = await bcrypt.hash(code, Number(env.salt));

    const stored = await this.redis.set({
      key: this.otpKey(userId, purpose),
      value: hashOtp,
      ttl: OTP_TTL_SECONDS,
      nx: !force,
    });

    if (!stored) {
      return false;
    }

    await sendEmail({
      to: email,
      subject,
      html:
        html?.(code) ??
        `<h1>hello ${userName ?? ""}, your code is ${code}</h1><br><p>please use this code to verify your account</p>`,
    });

    return true;
  }

  async exists(
    userId: string,
    purpose: OtpPurpose = "verify",
  ): Promise<boolean> {
    const count = await this.redis.exists(this.otpKey(userId, purpose));
    return count > 0;
  }

  async verify({
    userId,
    otp,
    purpose = "verify",
  }: VerifyOtpParams): Promise<boolean> {
    const hashOtp = await this.redis.get(this.otpKey(userId, purpose));
    return bcrypt.compare(otp, String(hashOtp));
  }

  async delete(userId: string, purpose: OtpPurpose = "verify"): Promise<void> {
    await this.redis.redis_delete(this.otpKey(userId, purpose));
  }

  async createResetToken(userId: string): Promise<string> {
    const { randomBytes } = await import("crypto");
    const token = randomBytes(32).toString("hex");
    const hashed = await bcrypt.hash(token, Number(env.salt));

    await this.redis.set({
      key: this.resetTokenKey(userId),
      value: hashed,
      ttl: OTP_TTL_SECONDS,
    });

    return token;
  }

  async verifyResetToken(userId: string, token: string): Promise<boolean> {
    const key = this.resetTokenKey(userId);
    const exists = await this.redis.exists(key);
    if (!exists) {
      return false;
    }

    const hashed = await this.redis.get(key);
    return bcrypt.compare(token, String(hashed));
  }

  async deleteResetToken(userId: string): Promise<void> {
    await this.redis.redis_delete(this.resetTokenKey(userId));
  }
}

export const generateOtpService = new GenerateOtpService();
