import { type Request, type Response, Router } from "express";
import { z } from "zod";
import { ReportStatus, ReportTargetType, RoleEnum } from "../../common/enums";
import { SuccessResponse } from "../../common/exceptions/sucsses.response";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validation } from "../../middleware/validation.middleware";
import reportService from "./report.service";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const createSchema = {
  body: z.object({
    targetType: z.nativeEnum(ReportTargetType),
    targetId: objectId,
    reason: z.string().trim().min(3).max(1000),
  }),
};
const updateSchema = {
  params: z.object({ reportId: objectId }),
  body: z.object({ status: z.nativeEnum(ReportStatus) }),
};

const router = Router();

router.post(
  "/",
  authMiddleware,
  validation(createSchema),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      status: 201,
      message: "Report submitted",
      data: await reportService.create(req.user!.id, req.body),
    }),
);

router.get("/", authMiddleware, async (req: Request, res: Response) =>
  SuccessResponse({
    res,
    message: "Reports fetched",
    data: await reportService.mine(req.user!.id),
  }),
);

router.get(
  "/all",
  authMiddleware,
  authorize(RoleEnum.Admin),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      message: "Reports fetched",
      data: await reportService.list(req.user!.role),
    }),
);

router.patch(
  "/:reportId",
  authMiddleware,
  authorize(RoleEnum.Admin),
  validation(updateSchema),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      message: "Report updated",
      data: await reportService.updateStatus(
        req.params.reportId as string,
        req.body.status,
      ),
    }),
);

export default router;
