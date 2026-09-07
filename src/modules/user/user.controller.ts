import { type Request, type Response, Router } from "express";
import multer from "multer";
import userService from "./user.service";
import { SuccessResponse } from "../../common/exceptions/sucsses.response";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validation } from "../../middleware/validation.middleware";
import {
  changePasswordSchema,
  getUsersSchema,
  updateProfileSchema,
  userIdParamSchema,
} from "./user.validation";
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

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  const data = await userService.getMe(req.user!.id);
  return SuccessResponse({
    res,
    message: "Profile fetched",
    status: 200,
    data,
  });
});

router.patch(
  "/me",
  authMiddleware,
  upload.single("profilePic"),
  validation(updateProfileSchema),
  async (req: Request, res: Response) => {
    const data = await userService.updateProfile(req.user!.id, req.body, req.file);
    return SuccessResponse({
      res,
      message: "Profile updated",
      status: 200,
      data,
    });
  },
);

router.patch(
  "/me/password",
  authMiddleware,
  validation(changePasswordSchema),
  async (req: Request, res: Response) => {
    const data = await userService.changePassword(req.user!.id, req.body);
    return SuccessResponse({
      res,
      message: "Password updated",
      status: 200,
      data,
    });
  },
);

router.delete("/me", authMiddleware, async (req: Request, res: Response) => {
  const data = await userService.deleteAccount(req.user!.id);
  return SuccessResponse({
    res,
    message: "Account deleted",
    status: 200,
    data,
  });
});

router.get(
  "/",
  validation(getUsersSchema),
  async (req: Request, res: Response) => {
    const query = getUsersSchema.query.parse(req.query);
    const data = await userService.getUsers(query);
    return SuccessResponse({
      res,
      message: "Users fetched",
      status: 200,
      data,
    });
  },
);

router.get(
  "/:userId",
  validation(userIdParamSchema),
  async (req: Request, res: Response) => {
    const data = await userService.getUserById(req.params.userId as string);
    return SuccessResponse({ res, message: "User fetched", status: 200, data });
  },
);

export default router;
