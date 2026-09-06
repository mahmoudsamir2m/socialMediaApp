import type { Request, Response, NextFunction } from "express";
import { tokenService } from "../common/services/token.service";
import { UnauthorizedException } from "../common/exceptions/applications.exceptions";
import type { TokenPayload } from "../common/interfaces";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authMiddleware = (
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

  req.user = tokenService.verifyAccessToken(token);
  next();
};
