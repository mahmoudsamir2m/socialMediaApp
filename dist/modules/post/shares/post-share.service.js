"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const applications_exceptions_1 = require("../../../common/exceptions/applications.exceptions");
const post_model_1 = require("../../../database/model/post.model");
class PostShareService {
    async share(postId, userId, content) {
        const original = await post_model_1.PostModel.findById(postId);
        if (!original)
            throw new applications_exceptions_1.NotFoundException("Post not found");
        if (original.author.toString() === userId)
            throw new applications_exceptions_1.BadRequestException("You cannot share your own post");
        const rootId = original.originalPost?.toString() ?? original._id.toString();
        const root = rootId === original._id.toString() ? original : await post_model_1.PostModel.findById(rootId).select("author");
        if (!root)
            throw new applications_exceptions_1.NotFoundException("Original post not found");
        if (root.author.toString() === userId)
            throw new applications_exceptions_1.BadRequestException("You cannot share your own post");
        const alreadyShared = await post_model_1.PostModel.exists({ author: userId, originalPost: rootId });
        if (alreadyShared)
            throw new applications_exceptions_1.ConflictException("You already shared this post");
        return post_model_1.PostModel.create({ author: userId, ...(content ? { content } : {}), images: [], originalPost: rootId });
    }
}
exports.default = new PostShareService();
