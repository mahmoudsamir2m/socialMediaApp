import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../../common/exceptions/applications.exceptions";
import { NotificationType } from "../../../common/enums";
import { PostModel } from "../../../database/model/post.model";
import notificationService from "../../notification/notification.service";

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
    const shared = await PostModel.create({
      author: userId,
      ...(content ? { content } : {}),
      images: [],
      originalPost: rootId,
    });
    await notificationService.create({
      recipient: root.author.toString(),
      actor: userId,
      type: NotificationType.Share,
      entityId: shared._id.toString(),
      entityType: "post",
    });
    return shared;
  }

  async unshare(postId: string, userId: string) {
    const original = await PostModel.findById(postId).select("_id originalPost");
    if (!original) throw new NotFoundException("Post not found");
    const rootId = original.originalPost?.toString() ?? original._id.toString();
    const shared = await PostModel.findOneAndDelete({
      author: userId,
      originalPost: rootId,
    });
    if (!shared) throw new NotFoundException("Shared post not found");
    return { message: "Post unshared" };
  }
}
export default new PostShareService();
