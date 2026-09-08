import type { NextFunction, Request, Response } from "express";
import { RoleEnum } from "../common/enums";
import { ForbiddenException } from "../common/exceptions/applications.exceptions";

export const authorize =
  (...roles: RoleEnum[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenException("You are not allowed to access this resource");
    }
    next();
  };
