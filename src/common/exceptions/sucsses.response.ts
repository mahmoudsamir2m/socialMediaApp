import type { Response } from "express";

export const SuccessResponse = ({
  res,
  message = "Success",
  status = 200,
  data = {},
}: {
  res: Response;
  message?: string;
  status?: number;
  data?: any;
}) => {
  return res.status(status).json({
    message,
    data,
  });
};
