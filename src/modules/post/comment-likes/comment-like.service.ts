import {
  ConflictException,
  NotFoundException,
} from "../../../common/exceptions/applications.exceptions";
import { NotificationType } from "../../../common/enums";
import { CommentLikeModel } from "../../../database/model/comment-like.model";
import { CommentModel } from "../../../database/model/comment.model";
import notificationService from "../../notification/notification.service";
class CommentLikeService {
  async like(commentId: string, userId: string) {
    const comment = await CommentModel.findById(commentId).select("author");
    if (!comment) throw new NotFoundException("Comment not found");
    try {
      await CommentLikeModel.create({ comment: commentId, user: userId });
    } catch (error: unknown) {
      if ((error as { code?: number }).code === 11000)
        throw new ConflictException("Comment is already liked");
      throw error;
    }
    await notificationService.create({
      recipient: comment.author.toString(),
      actor: userId,
      type: NotificationType.CommentLike,
      entityId: commentId,
      entityType: "comment",
    });
    return this.status(commentId, userId);
  }
  async unlike(commentId: string, userId: string) {
    if (!(await CommentModel.exists({ _id: commentId })))
      throw new NotFoundException("Comment not found");
    await CommentLikeModel.deleteOne({ comment: commentId, user: userId });
    return this.status(commentId, userId);
  }
  private async status(commentId: string, userId: string) {
    const [likesCount, liked] = await Promise.all([
      CommentLikeModel.countDocuments({ comment: commentId }),
      CommentLikeModel.exists({ comment: commentId, user: userId }),
    ]);
    return { likesCount, likedByCurrentUser: Boolean(liked) };
  }
}
export default new CommentLikeService();
