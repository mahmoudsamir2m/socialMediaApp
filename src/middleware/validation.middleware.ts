import type { Request, Response, NextFunction } from "express";
import type { ZodError, ZodType } from "zod";
import { BadRequestException } from "../common/exceptions/applications.exceptions";

type ValidationKey = keyof Request;
type ValidationSchema = Partial<Record<ValidationKey, ZodType>>;

export const validation = (schema: ValidationSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const validationErrors: { key: ValidationKey; issue: ZodError["issues"] }[] =
      [];
    for (const key of Object.keys(schema) as ValidationKey[]) {
      if (!schema[key]) {
        continue;
      }
      const value = schema[key].safeParse(req[key]);
      if (!value.success) {
        validationErrors.push({
          key,
          issue: value.error.issues,
        });
      }
    }
    if (validationErrors.length > 0) {
      throw new BadRequestException("validation errors", validationErrors);
    }
    next();
  };
};
