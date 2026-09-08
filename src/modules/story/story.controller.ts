import { type Request, type Response, Router } from "express";
import { z } from "zod";
import { SuccessResponse } from "../../common/exceptions/sucsses.response";
import { authMiddleware } from "../../middleware/auth.middleware";
import { imageUpload, uploadedFiles } from "../../middleware/upload.middleware";
import { validation } from "../../middleware/validation.middleware";
import storyService from "./story.service";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const createSchema = {
  body: z.object({ caption: z.string().trim().max(500).optional() }).strip(),
};
const storyParam = { params: z.object({ storyId: objectId }) };

const router = Router();

router.post(
  "/",
  authMiddleware,
  imageUpload.single("image"),
  validation(createSchema),
  async (req: Request, res: Response) => {
    const data = await storyService.create(
      req.user!.id,
      uploadedFiles(req)[0] ?? req.file,
      req.body.caption,
    );
    return SuccessResponse({
      res,
      status: 201,
      message: "Story created",
      data,
    });
  },
);

router.get("/", authMiddleware, async (req: Request, res: Response) =>
  SuccessResponse({
    res,
    message: "Stories fetched",
    data: await storyService.feed(req.user!.id),
  }),
);

router.get(
  "/:storyId",
  authMiddleware,
  validation(storyParam),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      message: "Story fetched",
      data: await storyService.getById(
        req.params.storyId as string,
        req.user!.id,
      ),
    }),
);

router.post(
  "/:storyId/view",
  authMiddleware,
  validation(storyParam),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      message: "Story viewed",
      data: await storyService.view(req.params.storyId as string, req.user!.id),
    }),
);

router.get(
  "/:storyId/viewers",
  authMiddleware,
  validation(storyParam),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      message: "Story viewers fetched",
      data: await storyService.viewers(
        req.params.storyId as string,
        req.user!.id,
      ),
    }),
);

router.delete(
  "/:storyId",
  authMiddleware,
  validation(storyParam),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      message: "Story deleted",
      data: await storyService.delete(
        req.params.storyId as string,
        req.user!.id,
      ),
    }),
);

export default router;
