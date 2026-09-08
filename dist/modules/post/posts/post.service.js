"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const applications_exceptions_1 = require("../../../common/exceptions/applications.exceptions");
const image_service_1 = require("../../../common/services/image.service");
const post_model_1 = require("../../../database/model/post.model");
const post_like_model_1 = require("../../../database/model/post-like.model");
const comment_model_1 = require("../../../database/model/comment.model");
const comment_like_model_1 = require("../../../database/model/comment-like.model");
const asArray = (value) => {
    if (!value)
        return [];
    if (Array.isArray(value))
        return value;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [value];
    }
    catch {
        return [value];
    }
};
class PostService {
    async upload(files, userId) {
        const uploaded = await image_service_1.imageService.uploadImages({ userId: `posts/${userId}`, files });
        return uploaded.map((image) => ({
            secureUrl: image.secureUrl, publicId: image.publicId,
            ...(image.width !== undefined ? { width: image.width } : {}),
            ...(image.height !== undefined ? { height: image.height } : {}),
        }));
    }
    async create(author, data, files) {
        if (!data.content && files.length === 0)
            throw new applications_exceptions_1.BadRequestException("Post must include content or at least one image");
        const images = files.length ? await this.upload(files, author) : [];
        try {
            return await post_model_1.PostModel.create({ author, ...(data.content ? { content: data.content } : {}), images });
        }
        catch (error) {
            await image_service_1.imageService.deleteImages(images.map((image) => image.publicId));
            throw error;
        }
    }
    async getById(id, viewerId) {
        if (!await post_model_1.PostModel.exists({ _id: id }))
            throw new applications_exceptions_1.NotFoundException("Post not found");
        return this.hydrate([id], viewerId).then((posts) => posts[0]);
    }
    async getFeed(query, viewerId) {
        const skip = (query.page - 1) * query.limit;
        const [posts, total] = await Promise.all([
            post_model_1.PostModel.find().sort({ createdAt: -1, _id: -1 }).skip(skip).limit(query.limit).select("_id").lean(),
            post_model_1.PostModel.countDocuments(),
        ]);
        const hydrated = await this.hydrate(posts.map((post) => post._id.toString()), viewerId);
        const order = new Map(hydrated.map((post) => [post._id.toString(), post]));
        return { posts: posts.map((post) => order.get(post._id.toString())), pagination: { ...query, total, totalPages: Math.ceil(total / query.limit) } };
    }
    async update(id, author, data, files) {
        const post = await post_model_1.PostModel.findById(id);
        if (!post)
            throw new applications_exceptions_1.NotFoundException("Post not found");
        if (post.author.toString() !== author)
            throw new applications_exceptions_1.ForbiddenException("You cannot update this post");
        const removeIds = asArray(data.removeImagePublicIds);
        const validRemove = new Set(post.images.filter((image) => removeIds.includes(image.publicId)).map((image) => image.publicId));
        const replace = data.replaceImages === true || data.replaceImages === "true";
        const uploaded = files.length ? await this.upload(files, author) : [];
        const oldImages = replace ? post.images : post.images.filter((image) => validRemove.has(image.publicId));
        try {
            if (data.content !== undefined)
                post.content = data.content;
            post.images = replace ? uploaded : [...post.images.filter((image) => !validRemove.has(image.publicId)), ...uploaded];
            if (!post.content && post.images.length === 0)
                throw new applications_exceptions_1.BadRequestException("Post must include content or at least one image");
            await post.save();
        }
        catch (error) {
            await image_service_1.imageService.deleteImages(uploaded.map((image) => image.publicId));
            throw error;
        }
        await image_service_1.imageService.deleteImages(oldImages.map((image) => image.publicId));
        return post;
    }
    async delete(id, author) {
        const post = await post_model_1.PostModel.findById(id);
        if (!post)
            throw new applications_exceptions_1.NotFoundException("Post not found");
        if (post.author.toString() !== author)
            throw new applications_exceptions_1.ForbiddenException("You cannot delete this post");
        const sharedPosts = await post_model_1.PostModel.find({ originalPost: id }).select("_id").lean();
        const postIds = [post._id, ...sharedPosts.map((shared) => shared._id)];
        const comments = await comment_model_1.CommentModel.find({ post: { $in: postIds } }).select("_id").lean();
        const commentIds = comments.map((comment) => comment._id);
        await Promise.all([
            post_like_model_1.PostLikeModel.deleteMany({ post: { $in: postIds } }),
            comment_model_1.CommentModel.deleteMany({ post: { $in: postIds } }),
            ...(commentIds.length ? [comment_like_model_1.CommentLikeModel.deleteMany({ comment: { $in: commentIds } })] : []),
            post_model_1.PostModel.deleteMany({ originalPost: id }),
            post.deleteOne(),
        ]);
        await image_service_1.imageService.deleteImages(post.images.map((image) => image.publicId));
        return { message: "Post deleted successfully" };
    }
    async hydrate(ids, viewerId) {
        if (!ids.length)
            return [];
        const viewer = viewerId ? new mongoose_1.Types.ObjectId(viewerId) : null;
        return post_model_1.PostModel.aggregate([
            { $match: { _id: { $in: ids.map((id) => new mongoose_1.Types.ObjectId(id)) } } },
            { $lookup: { from: "users", localField: "author", foreignField: "_id", pipeline: [{ $project: { firstName: 1, lastName: 1, profilePic: 1 } }], as: "author" } },
            { $unwind: "$author" },
            { $lookup: { from: "postlikes", let: { postId: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$post", "$$postId"] } } }], as: "likes" } },
            { $lookup: { from: "comments", let: { postId: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$post", "$$postId"] } } }], as: "comments" } },
            { $lookup: { from: "posts", let: { postId: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$originalPost", "$$postId"] } } }], as: "shares" } },
            { $lookup: { from: "posts", localField: "originalPost", foreignField: "_id", pipeline: [{ $lookup: { from: "users", localField: "author", foreignField: "_id", pipeline: [{ $project: { firstName: 1, lastName: 1, profilePic: 1 } }], as: "author" } }, { $unwind: "$author" }], as: "originalPost" } },
            { $unwind: { path: "$originalPost", preserveNullAndEmptyArrays: true } },
            { $project: { content: 1, images: 1, createdAt: 1, updatedAt: 1, author: 1, originalPost: 1, likesCount: { $size: "$likes" }, commentsCount: { $size: "$comments" }, sharesCount: { $size: "$shares" }, likedByCurrentUser: viewer ? { $in: [viewer, "$likes.user"] } : { $literal: false }, sharedByCurrentUser: viewer ? { $in: [viewer, "$shares.author"] } : { $literal: false } } },
        ]);
    }
}
exports.default = new PostService();
