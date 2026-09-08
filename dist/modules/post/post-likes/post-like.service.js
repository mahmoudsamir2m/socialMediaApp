"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const applications_exceptions_1 = require("../../../common/exceptions/applications.exceptions");
const post_like_model_1 = require("../../../database/model/post-like.model");
const post_model_1 = require("../../../database/model/post.model");
class PostLikeService {
    async like(postId, userId) {
        if (!await post_model_1.PostModel.exists({ _id: postId }))
            throw new applications_exceptions_1.NotFoundException("Post not found");
        try {
            await post_like_model_1.PostLikeModel.create({ post: postId, user: userId });
        }
        catch (error) {
            if (error.code === 11000)
                throw new applications_exceptions_1.ConflictException("Post is already liked");
            throw error;
        }
        return this.status(postId, userId);
    }
    async unlike(postId, userId) {
        if (!await post_model_1.PostModel.exists({ _id: postId }))
            throw new applications_exceptions_1.NotFoundException("Post not found");
        await post_like_model_1.PostLikeModel.deleteOne({ post: postId, user: userId });
        return this.status(postId, userId);
    }
    async status(postId, userId) {
        const [likesCount, liked] = await Promise.all([post_like_model_1.PostLikeModel.countDocuments({ post: postId }), post_like_model_1.PostLikeModel.exists({ post: postId, user: userId })]);
        return { likesCount, likedByCurrentUser: Boolean(liked) };
    }
}
exports.default = new PostLikeService();
