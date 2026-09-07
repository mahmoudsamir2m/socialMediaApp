import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB id");
const pagination = z.strictObject({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(20) });
const optionalContent = z.string().trim().min(1).max(5000).optional();

export const postIdSchema = { params: z.strictObject({ id: objectId }) };
export const postCommentIdSchema = { params: z.strictObject({ postId: objectId }) };
export const commentIdSchema = { params: z.strictObject({ commentId: objectId }) };
export const feedSchema = { query: pagination };
export const commentsSchema = { query: pagination, params: z.strictObject({ postId: objectId }) };
export const repliesSchema = { query: pagination, params: z.strictObject({ commentId: objectId }) };
export const createPostSchema = { body: z.object({ content: optionalContent }).strip() };
export const updatePostSchema = { body: z.object({ content: optionalContent, removeImagePublicIds: z.union([z.array(z.string().min(1)).max(10), z.string()]).optional(), replaceImages: z.union([z.boolean(), z.string()]).optional() }).strip() };
export const commentSchema = { body: z.strictObject({ content: z.string().trim().min(1).max(2000) }) };
