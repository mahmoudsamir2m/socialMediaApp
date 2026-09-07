import { Types } from "mongoose";
import { ForbiddenException, NotFoundException } from "../../../common/exceptions/applications.exceptions";
import { CommentModel } from "../../../database/model/comment.model";
import { CommentLikeModel } from "../../../database/model/comment-like.model";
import { PostModel } from "../../../database/model/post.model";
import type { CreateCommentDTO, PaginationDTO } from "../posts/post.dto";

class CommentService {
  async add(postId: string, author: string, data: CreateCommentDTO, parentCommentId?: string) {
    if (!await PostModel.exists({ _id: postId })) throw new NotFoundException("Post not found");
    if (parentCommentId) {
      const parent = await CommentModel.findById(parentCommentId);
      if (!parent || parent.post.toString() !== postId) throw new NotFoundException("Parent comment not found for this post");
      if (parent.parentComment) throw new ForbiddenException("Replies can only be one level deep");
    }
    return CommentModel.create({ post: postId, author, content: data.content, ...(parentCommentId ? { parentComment: parentCommentId } : {}) });
  }
  async list(postId: string, query: PaginationDTO, viewerId?: string, parentCommentId?: string) {
    if (!await PostModel.exists({ _id: postId })) throw new NotFoundException("Post not found");
    return this.listFor({ post: postId, parentComment: parentCommentId ? new Types.ObjectId(parentCommentId) : null }, query, viewerId);
  }
  async replies(commentId: string, query: PaginationDTO, viewerId?: string) {
    const parent = await CommentModel.findById(commentId);
    if (!parent) throw new NotFoundException("Comment not found");
    return this.listFor({ post: parent.post, parentComment: parent._id }, query, viewerId);
  }
  async update(commentId: string, userId: string, content: string) {
    const comment = await CommentModel.findById(commentId);
    if (!comment) throw new NotFoundException("Comment not found");
    if (comment.author.toString() !== userId) throw new ForbiddenException("You cannot update this comment");
    comment.content = content; await comment.save(); return comment;
  }
  async delete(commentId: string, userId: string) {
    const comment = await CommentModel.findById(commentId);
    if (!comment) throw new NotFoundException("Comment not found");
    const post = await PostModel.findById(comment.post).select("author");
    if (comment.author.toString() !== userId && post?.author.toString() !== userId) throw new ForbiddenException("You cannot delete this comment");
    const descendants = await CommentModel.find({ $or: [{ _id: comment._id }, { parentComment: comment._id }] }).select("_id").lean();
    const ids = descendants.map((item) => item._id);
    await Promise.all([CommentLikeModel.deleteMany({ comment: { $in: ids } }), CommentModel.deleteMany({ _id: { $in: ids } })]);
    return { message: "Comment deleted successfully" };
  }
  private async listFor(match: object, query: PaginationDTO, viewerId?: string) {
    const skip = (query.page - 1) * query.limit; const viewer = viewerId ? new Types.ObjectId(viewerId) : null;
    const [comments, totals] = await Promise.all([
      CommentModel.aggregate([{ $match: match }, { $sort: { createdAt: -1, _id: -1 } }, { $skip: skip }, { $limit: query.limit }, { $lookup: { from: "users", localField: "author", foreignField: "_id", pipeline: [{ $project: { firstName: 1, lastName: 1, profilePic: 1 } }], as: "author" } }, { $unwind: "$author" }, { $lookup: { from: "commentlikes", let: { id: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$comment", "$$id"] } } }], as: "likes" } }, { $lookup: { from: "comments", let: { id: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$parentComment", "$$id"] } } }], as: "replies" } }, { $project: { content: 1, post: 1, parentComment: 1, author: 1, createdAt: 1, updatedAt: 1, likesCount: { $size: "$likes" }, repliesCount: { $size: "$replies" }, likedByCurrentUser: viewer ? { $in: [viewer, "$likes.user"] } : { $literal: false } } }]),
      CommentModel.countDocuments(match),
    ]);
    return { comments, pagination: { ...query, total: totals, totalPages: Math.ceil(totals / query.limit) } };
  }
}
export default new CommentService();
