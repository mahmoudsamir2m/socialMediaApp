import type { Request, Response, NextFunction } from "express";
import { tokenService } from "../common/services/token.service";
import {
  ForbiddenException,
  UnauthorizedException,
} from "../common/exceptions/applications.exceptions";
import type { TokenPayload } from "../common/interfaces";
import UserModel from "../database/model/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedException("Access token is required");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new UnauthorizedException("Access token is required");
  }

  const payload = tokenService.verifyAccessToken(token);
  const user = await UserModel.findById(payload.id).select(
    "tokenVersion confirmEmail role",
  );

  if (!user) {
    throw new UnauthorizedException("Invalid access token");
  }

  if ((user.tokenVersion ?? 0) !== (payload.tokenVersion ?? 0)) {
    throw new UnauthorizedException("Session expired");
  }

  if (!user.confirmEmail) {
    throw new ForbiddenException("Please verify your email first");
  }

  req.user = {
    id: user._id.toString(),
    role: user.role ?? payload.role,
    tokenVersion: user.tokenVersion ?? 0,
  };
  next();
};
