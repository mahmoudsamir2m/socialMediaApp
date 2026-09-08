import { type Request, type Response, Router } from "express";
import { SuccessResponse } from "../../common/exceptions/sucsses.response";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validation } from "../../middleware/validation.middleware";
import friendService from "./friend.service";
import { z } from "zod";
const id = z.string().regex(/^[0-9a-fA-F]{24}$/);
const userParam = { params: z.object({ userId: id }) };
const requestParam = { params: z.object({ requestId: id }) };
const router = Router();
router.post(
  "/requests/:userId",
  authMiddleware,
  validation(userParam),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      status: 201,
      message: "Friend request sent",
      data: await friendService.send(req.user!.id, req.params.userId as string),
    }),
);
router.get(
  "/requests/received",
  authMiddleware,
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      data: await friendService.list(req.user!.id, "received"),
    }),
);
router.get(
  "/requests/sent",
  authMiddleware,
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      data: await friendService.list(req.user!.id, "sent"),
    }),
);
router.patch(
  "/requests/:requestId/accept",
  authMiddleware,
  validation(requestParam),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      data: await friendService.accept(
        req.params.requestId as string,
        req.user!.id,
      ),
    }),
);
router.patch(
  "/requests/:requestId/reject",
  authMiddleware,
  validation(requestParam),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      data: await friendService.reject(
        req.params.requestId as string,
        req.user!.id,
      ),
    }),
);
router.delete(
  "/requests/:requestId",
  authMiddleware,
  validation(requestParam),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      data: await friendService.cancel(
        req.params.requestId as string,
        req.user!.id,
      ),
    }),
);
router.get("/", authMiddleware, async (req: Request, res: Response) =>
  SuccessResponse({
    res,
    data: await friendService.list(req.user!.id, "friends"),
  }),
);
router.get(
  "/status/:userId",
  authMiddleware,
  validation(userParam),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      data: await friendService.status(
        req.user!.id,
        req.params.userId as string,
      ),
    }),
);
router.delete(
  "/:userId",
  authMiddleware,
  validation(userParam),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      data: await friendService.remove(
        req.user!.id,
        req.params.userId as string,
      ),
    }),
);
export default router;
