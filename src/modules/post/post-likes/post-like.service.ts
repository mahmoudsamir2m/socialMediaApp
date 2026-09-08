import {
  ConflictException,
  NotFoundException,
} from "../../../common/exceptions/applications.exceptions";
import { NotificationType } from "../../../common/enums";
import { PostLikeModel } from "../../../database/model/post-like.model";
import { PostModel } from "../../../database/model/post.model";
import notificationService from "../../notification/notification.service";

class PostLikeService {
  async like(postId: string, userId: string) {
    const post = await PostModel.findById(postId).select("author");
    if (!post) throw new NotFoundException("Post not found");
    try {
      await PostLikeModel.create({ post: postId, user: userId });
    } catch (error: unknown) {
      if ((error as { code?: number }).code === 11000)
        throw new ConflictException("Post is already liked");
      throw error;
    }
    await notificationService.create({
      recipient: post.author.toString(),
      actor: userId,
      type: NotificationType.PostLike,
      entityId: postId,
      entityType: "post",
    });
    return this.status(postId, userId);
  }
  async unlike(postId: string, userId: string) {
    if (!(await PostModel.exists({ _id: postId })))
      throw new NotFoundException("Post not found");
    await PostLikeModel.deleteOne({ post: postId, user: userId });
    return this.status(postId, userId);
  }
  async list(postId: string, page = 1, limit = 20) {
    if (!(await PostModel.exists({ _id: postId })))
      throw new NotFoundException("Post not found");
    const skip = (page - 1) * limit;
    const [likes, total] = await Promise.all([
      PostLikeModel.find({ post: postId })
        .populate("user", "firstName lastName profilePic")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PostLikeModel.countDocuments({ post: postId }),
    ]);
    return {
      likes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  private async status(postId: string, userId: string) {
    const [likesCount, liked] = await Promise.all([
      PostLikeModel.countDocuments({ post: postId }),
      PostLikeModel.exists({ post: postId, user: userId }),
    ]);
    return { likesCount, likedByCurrentUser: Boolean(liked) };
  }
}
export default new PostLikeService();
