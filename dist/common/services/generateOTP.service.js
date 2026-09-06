"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtpService = exports.GenerateOtpService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const env_service_1 = require("../../config/env.service");
const sendemail_1 = require("../utils/email/sendemail");
const redis_service_1 = require("./redis.service");
const OTP_TTL_SECONDS = 600;
class GenerateOtpService {
    redis;
    constructor(redis = redis_service_1.redisService) {
        this.redis = redis;
    }
    otpKey(userId, purpose = "verify") {
        return purpose === "verify" ? `otp::${userId}` : `otp::${purpose}::${userId}`;
    }
    resetTokenKey(userId) {
        return `reset-token::${userId}`;
    }
    async generate({ userId, email, userName, subject = "OTP verification", html, force = false, purpose = "verify", }) {
        if (!force && (await this.exists(userId, purpose))) {
            return false;
        }
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const hashOtp = await bcrypt_1.default.hash(code, Number(env_service_1.env.salt));
        const stored = await this.redis.set({
            key: this.otpKey(userId, purpose),
            value: hashOtp,
            ttl: OTP_TTL_SECONDS,
            nx: !force,
        });
        if (!stored) {
            return false;
        }
        await (0, sendemail_1.sendEmail)({
            to: email,
            subject,
            html: html?.(code) ??
                `<h1>hello ${userName ?? ""}, your code is ${code}</h1><br><p>please use this code to verify your account</p>`,
        });
        return true;
    }
    async exists(userId, purpose = "verify") {
        const count = await this.redis.exists(this.otpKey(userId, purpose));
        return count > 0;
    }
    async verify({ userId, otp, purpose = "verify", }) {
        const hashOtp = await this.redis.get(this.otpKey(userId, purpose));
        return bcrypt_1.default.compare(otp, String(hashOtp));
    }
    async delete(userId, purpose = "verify") {
        await this.redis.redis_delete(this.otpKey(userId, purpose));
    }
    async createResetToken(userId) {
        const { randomBytes } = await import("crypto");
        const token = randomBytes(32).toString("hex");
        const hashed = await bcrypt_1.default.hash(token, Number(env_service_1.env.salt));
        await this.redis.set({
            key: this.resetTokenKey(userId),
            value: hashed,
            ttl: OTP_TTL_SECONDS,
        });
        return token;
    }
    async verifyResetToken(userId, token) {
        const key = this.resetTokenKey(userId);
        const exists = await this.redis.exists(key);
        if (!exists) {
            return false;
        }
        const hashed = await this.redis.get(key);
        return bcrypt_1.default.compare(token, String(hashed));
    }
    async deleteResetToken(userId) {
        await this.redis.redis_delete(this.resetTokenKey(userId));
    }
}
exports.GenerateOtpService = GenerateOtpService;
exports.generateOtpService = new GenerateOtpService();
