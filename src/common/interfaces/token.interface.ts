import type { RoleEnum } from "../enums";

export interface TokenPayload {
  id: string;
  role: RoleEnum;
  tokenVersion?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
