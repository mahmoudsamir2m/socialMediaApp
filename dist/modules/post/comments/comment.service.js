"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const applications_exceptions_1 = require("../../../common/exceptions/applications.exceptions");
const comment_model_1 = require("../../../database/model/comment.model");
const comment_like_model_1 = require("../../../database/model/comment-like.model");
const post_model_1 = require("../../../database/model/post.model");
class CommentService {
    async add(postId, author, data, parentCommentId) {
        if (!await post_model_1.PostModel.exists({ _id: postId }))
            throw new applications_exceptions_1.NotFoundException("Post not found");
        if (parentCommentId) {
            const parent = await comment_model_1.CommentModel.findById(parentCommentId);
            if (!parent || parent.post.toString() !== postId)
                throw new applications_exceptions_1.NotFoundException("Parent comment not found for this post");
            if (parent.parentComment)
                throw new applications_exceptions_1.ForbiddenException("Replies can only be one level deep");
        }
        return comment_model_1.CommentModel.create({ post: postId, author, content: data.content, ...(parentCommentId ? { parentComment: parentCommentId } : {}) });
    }
    async list(postId, query, viewerId, parentCommentId) {
        if (!await post_model_1.PostModel.exists({ _id: postId }))
            throw new applications_exceptions_1.NotFoundException("Post not found");
        return this.listFor({ post: postId, parentComment: parentCommentId ? new mongoose_1.Types.ObjectId(parentCommentId) : null }, query, viewerId);
    }
    async replies(commentId, query, viewerId) {
        const parent = await comment_model_1.CommentModel.findById(commentId);
        if (!parent)
            throw new applications_exceptions_1.NotFoundException("Comment not found");
        return this.listFor({ post: parent.post, parentComment: parent._id }, query, viewerId);
    }
    async update(commentId, userId, content) {
        const comment = await comment_model_1.CommentModel.findById(commentId);
        if (!comment)
            throw new applications_exceptions_1.NotFoundException("Comment not found");
        if (comment.author.toString() !== userId)
            throw new applications_exceptions_1.ForbiddenException("You cannot update this comment");
        comment.content = content;
        await comment.save();
        return comment;
    }
    async delete(commentId, userId) {
        const comment = await comment_model_1.CommentModel.findById(commentId);
        if (!comment)
            throw new applications_exceptions_1.NotFoundException("Comment not found");
        const post = await post_model_1.PostModel.findById(comment.post).select("author");
        if (comment.author.toString() !== userId && post?.author.toString() !== userId)
            throw new applications_exceptions_1.ForbiddenException("You cannot delete this comment");
        const descendants = await comment_model_1.CommentModel.find({ $or: [{ _id: comment._id }, { parentComment: comment._id }] }).select("_id").lean();
        const ids = descendants.map((item) => item._id);
        await Promise.all([comment_like_model_1.CommentLikeModel.deleteMany({ comment: { $in: ids } }), comment_model_1.CommentModel.deleteMany({ _id: { $in: ids } })]);
        return { message: "Comment deleted successfully" };
    }
    async listFor(match, query, viewerId) {
        const skip = (query.page - 1) * query.limit;
        const viewer = viewerId ? new mongoose_1.Types.ObjectId(viewerId) : null;
        const [comments, totals] = await Promise.all([
            comment_model_1.CommentModel.aggregate([{ $match: match }, { $sort: { createdAt: -1, _id: -1 } }, { $skip: skip }, { $limit: query.limit }, { $lookup: { from: "users", localField: "author", foreignField: "_id", pipeline: [{ $project: { firstName: 1, lastName: 1, profilePic: 1 } }], as: "author" } }, { $unwind: "$author" }, { $lookup: { from: "commentlikes", let: { id: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$comment", "$$id"] } } }], as: "likes" } }, { $lookup: { from: "comments", let: { id: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$parentComment", "$$id"] } } }], as: "replies" } }, { $project: { content: 1, post: 1, parentComment: 1, author: 1, createdAt: 1, updatedAt: 1, likesCount: { $size: "$likes" }, repliesCount: { $size: "$replies" }, likedByCurrentUser: viewer ? { $in: [viewer, "$likes.user"] } : { $literal: false } } }]),
            comment_model_1.CommentModel.countDocuments(match),
        ]);
        return { comments, pagination: { ...query, total: totals, totalPages: Math.ceil(totals / query.limit) } };
    }
}
exports.default = new CommentService();
