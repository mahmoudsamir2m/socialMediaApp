import mongoose, { type Types } from "mongoose";

export interface IComment {
  post: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  parentComment?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
const schema = new mongoose.Schema<IComment>({
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  content: { type: String, trim: true, required: true, maxlength: 2000 },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: undefined, index: true },
}, { timestamps: true });
schema.index({ post: 1, parentComment: 1, createdAt: -1 });
export const CommentModel = mongoose.model<IComment>("Comment", schema);
