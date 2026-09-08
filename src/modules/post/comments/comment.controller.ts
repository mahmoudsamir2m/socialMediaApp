import { type Request, type Response, Router } from "express";
import { BadRequestException } from "../../../common/exceptions/applications.exceptions";
import { SuccessResponse } from "../../../common/exceptions/sucsses.response";
import { CommentModel } from "../../../database/model/comment.model";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { validation } from "../../../middleware/validation.middleware";
import commentLikeService from "../comment-likes/comment-like.service";
import commentService from "./comment.service";
import {
  commentIdSchema,
  commentSchema,
  repliesSchema,
} from "../posts/post.validation";

const router = Router();

router.patch(
  "/:commentId",
  authMiddleware,
  validation({ ...commentIdSchema, ...commentSchema }),
  async (req: Request, res: Response) => {
    const data = await commentService.update(
      req.params.commentId as string,
      req.user!.id,
      req.body.content,
    );
    return SuccessResponse({
      res,
      message: "Comment updated",
      status: 200,
      data,
    });
  },
);

router.delete(
  "/:commentId",
  authMiddleware,
  validation(commentIdSchema),
  async (req: Request, res: Response) => {
    const data = await commentService.delete(
      req.params.commentId as string,
      req.user!.id,
    );
    return SuccessResponse({
      res,
      message: "Comment deleted",
      status: 200,
      data,
    });
  },
);

router.post(
  "/:commentId/replies",
  authMiddleware,
  validation({ ...commentIdSchema, ...commentSchema }),
  async (req: Request, res: Response) => {
    const comment = await CommentModel.findById(req.params.commentId);
    if (!comment) {
      throw new BadRequestException("Comment not found");
    }

    const data = await commentService.add(
      comment.post.toString(),
      req.user!.id,
      req.body,
      req.params.commentId as string,
    );
    return SuccessResponse({
      res,
      message: "Reply created",
      status: 201,
      data,
    });
  },
);

router.get(
  "/:commentId/replies",
  authMiddleware,
  validation(repliesSchema),
  async (req: Request, res: Response) => {
    const query = repliesSchema.query.parse(req.query);
    const data = await commentService.replies(
      req.params.commentId as string,
      query,
      req.user!.id,
    );
    return SuccessResponse({
      res,
      message: "Replies fetched",
      status: 200,
      data,
    });
  },
);

router.post(
  "/:commentId/like",
  authMiddleware,
  validation(commentIdSchema),
  async (req: Request, res: Response) => {
    const data = await commentLikeService.like(
      req.params.commentId as string,
      req.user!.id,
    );
    return SuccessResponse({
      res,
      message: "Comment liked",
      status: 201,
      data,
    });
  },
);

router.delete(
  "/:commentId/like",
  authMiddleware,
  validation(commentIdSchema),
  async (req: Request, res: Response) => {
    const data = await commentLikeService.unlike(
      req.params.commentId as string,
      req.user!.id,
    );
    return SuccessResponse({
      res,
      message: "Comment unliked",
      status: 200,
      data,
    });
  },
);

export default router;
