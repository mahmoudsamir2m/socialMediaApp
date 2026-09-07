import { type Request, type Response, Router } from "express";
import multer from "multer";
import authService from "./auth.service";
import { SuccessResponse } from "../../common/exceptions/sucsses.response";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  signupSchema,
  verifyOtpSchema,
} from "./auth.validation";
import { validation } from "../../middleware/validation.middleware";
import { BadRequestException } from "../../common/exceptions/applications.exceptions";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new BadRequestException("Only image files are allowed for profile picture"));
      return;
    }

    cb(null, true);
  },
});

const router = Router();

router.post("/login", validation(loginSchema), async (req: Request, res: Response) => {
  const data = await authService.login(req.body);
  return SuccessResponse({ res, message: "Login success", status: 200, data });
});

router.post(
  "/signup",
  upload.single("profilePic"),
  validation(signupSchema),
  async (req: Request, res: Response) => {
    const data = await authService.signup(req.body, req.file);
    return SuccessResponse({ res, message: "Signup success", status: 201, data });
  },
);

router.post(
  "/verify-otp",
  validation(verifyOtpSchema),
  async (req: Request, res: Response) => {
    const data = await authService.verifyOtp(req.body);
    return SuccessResponse({
      res,
      message: "Email verified successfully",
      status: 200,
      data,
    });
  },
);

router.post(
  "/forgot-password",
  validation(forgotPasswordSchema),
  async (req: Request, res: Response) => {
    const data = await authService.forgotPassword(req.body);
    return SuccessResponse({
      res,
      message: "Password reset token sent to your email",
      status: 200,
      data,
    });
  },
);

router.post(
  "/reset-password",
  validation(resetPasswordSchema),
  async (req: Request, res: Response) => {
    const data = await authService.resetPassword(req.body);
    return SuccessResponse({
      res,
      message: "Password reset successfully",
      status: 200,
      data,
    });
  },
);

router.post(
  "/refresh-token",
  validation(refreshTokenSchema),
  async (req: Request, res: Response) => {
    const data = await authService.refreshToken(req.body);
    return SuccessResponse({
      res,
      message: "Token refreshed successfully",
      status: 200,
      data,
    });
  },
);

export default router;
