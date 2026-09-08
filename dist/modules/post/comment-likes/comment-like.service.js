"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const applications_exceptions_1 = require("../../../common/exceptions/applications.exceptions");
const comment_like_model_1 = require("../../../database/model/comment-like.model");
const comment_model_1 = require("../../../database/model/comment.model");
class CommentLikeService {
    async like(commentId, userId) { if (!await comment_model_1.CommentModel.exists({ _id: commentId }))
        throw new applications_exceptions_1.NotFoundException("Comment not found"); try {
        await comment_like_model_1.CommentLikeModel.create({ comment: commentId, user: userId });
    }
    catch (error) {
        if (error.code === 11000)
            throw new applications_exceptions_1.ConflictException("Comment is already liked");
        throw error;
    } return this.status(commentId, userId); }
    async unlike(commentId, userId) { if (!await comment_model_1.CommentModel.exists({ _id: commentId }))
        throw new applications_exceptions_1.NotFoundException("Comment not found"); await comment_like_model_1.CommentLikeModel.deleteOne({ comment: commentId, user: userId }); return this.status(commentId, userId); }
    async status(commentId, userId) { const [likesCount, liked] = await Promise.all([comment_like_model_1.CommentLikeModel.countDocuments({ comment: commentId }), comment_like_model_1.CommentLikeModel.exists({ comment: commentId, user: userId })]); return { likesCount, likedByCurrentUser: Boolean(liked) }; }
}
exports.default = new CommentLikeService();
