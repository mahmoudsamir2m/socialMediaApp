import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../../common/exceptions/applications.exceptions";
import { PostModel } from "../../../database/model/post.model";

class PostShareService {
  async share(postId: string, userId: string, content?: string) {
    const original = await PostModel.findById(postId);
    if (!original) throw new NotFoundException("Post not found");
    if (original.author.toString() === userId)
      throw new BadRequestException("You cannot share your own post");
    const rootId = original.originalPost?.toString() ?? original._id.toString();
    const root =
      rootId === original._id.toString()
        ? original
        : await PostModel.findById(rootId).select("author");
    if (!root) throw new NotFoundException("Original post not found");
    if (root.author.toString() === userId)
      throw new BadRequestException("You cannot share your own post");
    const alreadyShared = await PostModel.exists({
      author: userId,
      originalPost: rootId,
    });
    if (alreadyShared)
      throw new ConflictException("You already shared this post");
    return PostModel.create({
      author: userId,
      ...(content ? { content } : {}),
      images: [],
      originalPost: rootId,
    });
  }
}
export default new PostShareService();
