import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env.service";
import { RoleEnum } from "../enums";
import { UnauthorizedException } from "../exceptions/applications.exceptions";
import type { TokenPair, TokenPayload } from "../interfaces/token.interface";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "1y";

export class TokenService {
  private getSecrets(role: RoleEnum) {
    if (role === RoleEnum.Admin) {
      return {
        accessSecret: env.adminSignature,
        refreshSecret: env.adminRefreshSignature,
      };
    }

    return {
      accessSecret: env.userSignature,
      refreshSecret: env.userRefreshSignature,
    };
  }

  private decodeRole(token: string): RoleEnum {
    const decoded = jwt.decode(token) as TokenPayload | null;

    if (decoded?.role === undefined) {
      throw new UnauthorizedException("Invalid token");
    }

    return decoded.role;
  }

  private verifyToken(
    token: string,
    type: "access" | "refresh",
    role: RoleEnum,
  ): TokenPayload {
    const { accessSecret, refreshSecret } = this.getSecrets(role);
    const secret = type === "access" ? accessSecret : refreshSecret;

    try {
      const decoded = jwt.verify(token, secret) as JwtPayload & TokenPayload;

      return {
        id: decoded.id,
        role: decoded.role,
        tokenVersion: decoded.tokenVersion ?? 0,
      };
    } catch {
      throw new UnauthorizedException(`Invalid or expired ${type} token`);
    }
  }

  generateAccessToken(payload: TokenPayload): string {
    const { accessSecret } = this.getSecrets(payload.role);

    return jwt.sign(payload, accessSecret, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  generateRefreshToken(payload: TokenPayload): string {
    const { refreshSecret } = this.getSecrets(payload.role);

    return jwt.sign(payload, refreshSecret, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  generateTokenPair(payload: TokenPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  verifyAccessToken(token: string): TokenPayload {
    const role = this.decodeRole(token);
    return this.verifyToken(token, "access", role);
  }

  verifyRefreshToken(token: string): TokenPayload {
    const role = this.decodeRole(token);
    return this.verifyToken(token, "refresh", role);
  }

  refreshTokenPair(refreshToken: string): TokenPair {
    const payload = this.verifyRefreshToken(refreshToken);
    return this.generateTokenPair(payload);
  }
}

export const tokenService = new TokenService();
