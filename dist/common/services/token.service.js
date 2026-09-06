"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenService = exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_service_1 = require("../../config/env.service");
const enums_1 = require("../enums");
const applications_exceptions_1 = require("../exceptions/applications.exceptions");
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "1y";
class TokenService {
    getSecrets(role) {
        if (role === enums_1.RoleEnum.Admin) {
            return {
                accessSecret: env_service_1.env.adminSignature,
                refreshSecret: env_service_1.env.adminRefreshSignature,
            };
        }
        return {
            accessSecret: env_service_1.env.userSignature,
            refreshSecret: env_service_1.env.userRefreshSignature,
        };
    }
    decodeRole(token) {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (decoded?.role === undefined) {
            throw new applications_exceptions_1.UnauthorizedException("Invalid token");
        }
        return decoded.role;
    }
    verifyToken(token, type, role) {
        const { accessSecret, refreshSecret } = this.getSecrets(role);
        const secret = type === "access" ? accessSecret : refreshSecret;
        try {
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            return {
                id: decoded.id,
                role: decoded.role,
            };
        }
        catch {
            throw new applications_exceptions_1.UnauthorizedException(`Invalid or expired ${type} token`);
        }
    }
    generateAccessToken(payload) {
        const { accessSecret } = this.getSecrets(payload.role);
        return jsonwebtoken_1.default.sign(payload, accessSecret, {
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        });
    }
    generateRefreshToken(payload) {
        const { refreshSecret } = this.getSecrets(payload.role);
        return jsonwebtoken_1.default.sign(payload, refreshSecret, {
            expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        });
    }
    generateTokenPair(payload) {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload),
        };
    }
    verifyAccessToken(token) {
        const role = this.decodeRole(token);
        return this.verifyToken(token, "access", role);
    }
    verifyRefreshToken(token) {
        const role = this.decodeRole(token);
        return this.verifyToken(token, "refresh", role);
    }
    refreshTokenPair(refreshToken) {
        const payload = this.verifyRefreshToken(refreshToken);
        return this.generateTokenPair(payload);
    }
}
exports.TokenService = TokenService;
exports.tokenService = new TokenService();
