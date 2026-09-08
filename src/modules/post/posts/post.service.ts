import { Types } from "mongoose";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../../../common/exceptions/applications.exceptions";
import { imageService } from "../../../common/services/image.service";
import { PostModel } from "../../../database/model/post.model";
import { PostLikeModel } from "../../../database/model/post-like.model";
import { CommentModel } from "../../../database/model/comment.model";
import { CommentLikeModel } from "../../../database/model/comment-like.model";
import type { CreatePostDTO, PaginationDTO, UpdatePostDTO } from "./post.dto";

const asArray = (value?: string | string[]) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [value];
  } catch {
    return [value];
  }
};

class PostService {
  private async upload(files: Express.Multer.File[], userId: string) {
    const uploaded = await imageService.uploadImages({
      userId: `posts/${userId}`,
      files,
    });
    return uploaded.map((image) => ({
      secureUrl: image.secureUrl,
      publicId: image.publicId,
      ...(image.width !== undefined ? { width: image.width } : {}),
      ...(image.height !== undefined ? { height: image.height } : {}),
    }));
  }

  async create(
    author: string,
    data: CreatePostDTO,
    files: Express.Multer.File[],
  ) {
    if (!data.content && files.length === 0)
      throw new BadRequestException(
        "Post must include content or at least one image",
      );
    const images = files.length ? await this.upload(files, author) : [];
    try {
      return await PostModel.create({
        author,
        ...(data.content ? { content: data.content } : {}),
        images,
      });
    } catch (error) {
      await imageService.deleteImages(images.map((image) => image.publicId));
      throw error;
    }
  }

  async getById(id: string, viewerId?: string) {
    if (!(await PostModel.exists({ _id: id })))
      throw new NotFoundException("Post not found");
    return this.hydrate([id], viewerId).then((posts) => posts[0]);
  }

  async getFeed(query: PaginationDTO, viewerId?: string) {
    const skip = (query.page - 1) * query.limit;
    const [posts, total] = await Promise.all([
      PostModel.find()
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(query.limit)
        .select("_id")
        .lean(),
      PostModel.countDocuments(),
    ]);
    const hydrated = await this.hydrate(
      posts.map((post) => post._id.toString()),
      viewerId,
    );
    const order = new Map(hydrated.map((post) => [post._id.toString(), post]));
    return {
      posts: posts.map((post) => order.get(post._id.toString())),
      pagination: {
        ...query,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async update(
    id: string,
    author: string,
    data: UpdatePostDTO,
    files: Express.Multer.File[],
  ) {
    const post = await PostModel.findById(id);
    if (!post) throw new NotFoundException("Post not found");
    if (post.author.toString() !== author)
      throw new ForbiddenException("You cannot update this post");
    const removeIds = asArray(data.removeImagePublicIds);
    const validRemove = new Set(
      post.images
        .filter((image) => removeIds.includes(image.publicId))
        .map((image) => image.publicId),
    );
    const replace =
      data.replaceImages === true || data.replaceImages === "true";
    const uploaded = files.length ? await this.upload(files, author) : [];
    const oldImages = replace
      ? post.images
      : post.images.filter((image) => validRemove.has(image.publicId));
    try {
      if (data.content !== undefined) post.content = data.content;
      post.images = replace
        ? uploaded
        : [
            ...post.images.filter((image) => !validRemove.has(image.publicId)),
            ...uploaded,
          ];
      if (!post.content && post.images.length === 0)
        throw new BadRequestException(
          "Post must include content or at least one image",
        );
      await post.save();
    } catch (error) {
      await imageService.deleteImages(uploaded.map((image) => image.publicId));
      throw error;
    }
    await imageService.deleteImages(oldImages.map((image) => image.publicId));
    return post;
  }

  async delete(id: string, author: string) {
    const post = await PostModel.findById(id);
    if (!post) throw new NotFoundException("Post not found");
    if (post.author.toString() !== author)
      throw new ForbiddenException("You cannot delete this post");
    const sharedPosts = await PostModel.find({ originalPost: id })
      .select("_id")
      .lean();
    const postIds = [post._id, ...sharedPosts.map((shared) => shared._id)];
    const comments = await CommentModel.find({ post: { $in: postIds } })
      .select("_id")
      .lean();
    const commentIds = comments.map((comment) => comment._id);
    await Promise.all([
      PostLikeModel.deleteMany({ post: { $in: postIds } }),
      CommentModel.deleteMany({ post: { $in: postIds } }),
      ...(commentIds.length
        ? [CommentLikeModel.deleteMany({ comment: { $in: commentIds } })]
        : []),
      PostModel.deleteMany({ originalPost: id }),
      post.deleteOne(),
    ]);
    await imageService.deleteImages(post.images.map((image) => image.publicId));
    return { message: "Post deleted successfully" };
  }

  private async hydrate(ids: string[], viewerId?: string) {
    if (!ids.length) return [];
    const viewer = viewerId ? new Types.ObjectId(viewerId) : null;
    return PostModel.aggregate([
      { $match: { _id: { $in: ids.map((id) => new Types.ObjectId(id)) } } },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          pipeline: [
            { $project: { firstName: 1, lastName: 1, profilePic: 1 } },
          ],
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $lookup: {
          from: "postlikes",
          let: { postId: "$_id" },
          pipeline: [{ $match: { $expr: { $eq: ["$post", "$$postId"] } } }],
          as: "likes",
        },
      },
      {
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [{ $match: { $expr: { $eq: ["$post", "$$postId"] } } }],
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "posts",
          let: { postId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$originalPost", "$$postId"] } } },
          ],
          as: "shares",
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "originalPost",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                pipeline: [
                  { $project: { firstName: 1, lastName: 1, profilePic: 1 } },
                ],
                as: "author",
              },
            },
            { $unwind: "$author" },
          ],
          as: "originalPost",
        },
      },
      { $unwind: { path: "$originalPost", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          content: 1,
          images: 1,
          createdAt: 1,
          updatedAt: 1,
          author: 1,
          originalPost: 1,
          likesCount: { $size: "$likes" },
          commentsCount: { $size: "$comments" },
          sharesCount: { $size: "$shares" },
          likedByCurrentUser: viewer
            ? { $in: [viewer, "$likes.user"] }
            : { $literal: false },
          sharedByCurrentUser: viewer
            ? { $in: [viewer, "$shares.author"] }
            : { $literal: false },
        },
      },
    ]);
  }
}
export default new PostService();
