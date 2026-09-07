import { ConflictException, NotFoundException } from "../../../common/exceptions/applications.exceptions";
import { PostLikeModel } from "../../../database/model/post-like.model";
import { PostModel } from "../../../database/model/post.model";

class PostLikeService {
  async like(postId: string, userId: string) {
    if (!await PostModel.exists({ _id: postId })) throw new NotFoundException("Post not found");
    try { await PostLikeModel.create({ post: postId, user: userId }); }
    catch (error: unknown) { if ((error as { code?: number }).code === 11000) throw new ConflictException("Post is already liked"); throw error; }
    return this.status(postId, userId);
  }
  async unlike(postId: string, userId: string) {
    if (!await PostModel.exists({ _id: postId })) throw new NotFoundException("Post not found");
    await PostLikeModel.deleteOne({ post: postId, user: userId });
    return this.status(postId, userId);
  }
  private async status(postId: string, userId: string) {
    const [likesCount, liked] = await Promise.all([PostLikeModel.countDocuments({ post: postId }), PostLikeModel.exists({ post: postId, user: userId })]);
    return { likesCount, likedByCurrentUser: Boolean(liked) };
  }
}
export default new PostLikeService();
