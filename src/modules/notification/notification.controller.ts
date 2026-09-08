import { type Request, type Response, Router } from "express";
import { z } from "zod";
import { SuccessResponse } from "../../common/exceptions/sucsses.response";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validation } from "../../middleware/validation.middleware";
import notificationService from "./notification.service";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const listSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
};
const idSchema = { params: z.object({ notificationId: objectId }) };

const router = Router();

router.get(
  "/",
  authMiddleware,
  validation(listSchema),
  async (req: Request, res: Response) => {
    const query = listSchema.query.parse(req.query);
    const data = await notificationService.list(
      req.user!.id,
      query.page,
      query.limit,
    );
    return SuccessResponse({
      res,
      message: "Notifications fetched",
      data,
    });
  },
);

router.patch(
  "/read",
  authMiddleware,
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      message: "Notifications marked as read",
      data: await notificationService.markRead(req.user!.id),
    }),
);

router.patch(
  "/:notificationId/read",
  authMiddleware,
  validation(idSchema),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      message: "Notification marked as read",
      data: await notificationService.markRead(
        req.user!.id,
        req.params.notificationId as string,
      ),
    }),
);

export default router;
