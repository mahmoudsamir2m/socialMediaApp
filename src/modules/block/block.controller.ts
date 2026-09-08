import { type Request, type Response, Router } from "express";
import { z } from "zod";
import { SuccessResponse } from "../../common/exceptions/sucsses.response";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validation } from "../../middleware/validation.middleware";
import blockService from "./block.service";

const userParam = {
  params: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id"),
  }),
};

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) =>
  SuccessResponse({
    res,
    message: "Blocked users fetched",
    data: await blockService.list(req.user!.id),
  }),
);

router.post(
  "/:userId",
  authMiddleware,
  validation(userParam),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      status: 201,
      message: "User blocked",
      data: await blockService.block(
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
      message: "User unblocked",
      data: await blockService.unblock(
        req.user!.id,
        req.params.userId as string,
      ),
    }),
);

export default router;
