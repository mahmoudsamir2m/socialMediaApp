import { type Request, type Response, Router } from "express";
import multer from "multer";
import { BadRequestException } from "../../../common/exceptions/applications.exceptions";
import { SuccessResponse } from "../../../common/exceptions/sucsses.response";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { validation } from "../../../middleware/validation.middleware";
import commentService from "../comments/comment.service";
import postLikeService from "../post-likes/post-like.service";
import postService from "./post.service";
import postShareService from "../shares/post-share.service";
import { commentSchema, commentsSchema, createPostSchema, feedSchema, postCommentIdSchema, postIdSchema, updatePostSchema } from "./post.validation";

const uploadedFiles = (req: Request) => {
  return (Array.isArray(req.files) ? req.files : []) as Express.Multer.File[];
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new BadRequestException("Only image files are allowed"));
      return;
    }

    cb(null, true);
  },
});

const router = Router();
router.post(
  "/",
  authMiddleware,
  upload.array("images", 10),
  validation(createPostSchema),
  async (req: Request, res: Response) => {
    const data = await postService.create(req.user!.id, req.body, uploadedFiles(req));
    return SuccessResponse({ res, message: "Post created", status: 201, data });
  },
);

router.get("/", authMiddleware, validation(feedSchema), async (req: Request, res: Response) => {
  const query = feedSchema.query.parse(req.query);
  const data = await postService.getFeed(query, req.user!.id);
  return SuccessResponse({ res, message: "Posts fetched", status: 200, data });
});

router.get("/:id", authMiddleware, validation(postIdSchema), async (req: Request, res: Response) => {
  const data = await postService.getById(req.params.id as string, req.user!.id);
  return SuccessResponse({ res, message: "Post fetched", status: 200, data });
});

router.patch(
  "/:id",
  authMiddleware,
  upload.array("images", 10),
  validation({ ...postIdSchema, ...updatePostSchema }),
  async (req: Request, res: Response) => {
    const data = await postService.update(req.params.id as string, req.user!.id, req.body, uploadedFiles(req));
    return SuccessResponse({ res, message: "Post updated", status: 200, data });
  },
);

router.delete("/:id", authMiddleware, validation(postIdSchema), async (req: Request, res: Response) => {
  const data = await postService.delete(req.params.id as string, req.user!.id);
  return SuccessResponse({ res, message: "Post deleted", status: 200, data });
});

router.post("/:id/like", authMiddleware, validation(postIdSchema), async (req: Request, res: Response) => {
  const data = await postLikeService.like(req.params.id as string, req.user!.id);
  return SuccessResponse({ res, message: "Post liked", status: 201, data });
});

router.delete("/:id/like", authMiddleware, validation(postIdSchema), async (req: Request, res: Response) => {
  const data = await postLikeService.unlike(req.params.id as string, req.user!.id);
  return SuccessResponse({ res, message: "Post unliked", status: 200, data });
});

router.post("/:id/share", authMiddleware, validation({ ...postIdSchema, ...createPostSchema }), async (req: Request, res: Response) => {
  const data = await postShareService.share(req.params.id as string, req.user!.id, req.body.content);
  return SuccessResponse({ res, message: "Post shared", status: 201, data });
});

router.post("/:postId/comments", authMiddleware, validation({ ...postCommentIdSchema, ...commentSchema }), async (req: Request, res: Response) => {
  const data = await commentService.add(req.params.postId as string, req.user!.id, req.body);
  return SuccessResponse({ res, message: "Comment created", status: 201, data });
});

router.get("/:postId/comments", authMiddleware, validation(commentsSchema), async (req: Request, res: Response) => {
  const query = commentsSchema.query.parse(req.query);
  const data = await commentService.list(req.params.postId as string, query, req.user!.id);
  return SuccessResponse({ res, message: "Comments fetched", status: 200, data });
});

export default router;
