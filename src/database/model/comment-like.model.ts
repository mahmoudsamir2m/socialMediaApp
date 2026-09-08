import mongoose, { type Types } from "mongoose";

export interface ICommentLike {
  comment: Types.ObjectId;
  user: Types.ObjectId;
  createdAt?: Date;
}

const commentLikeSchema = new mongoose.Schema<ICommentLike>(
  {
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

commentLikeSchema.index({ comment: 1, user: 1 }, { unique: true });

export const CommentLikeModel = mongoose.model<ICommentLike>(
  "CommentLike",
  commentLikeSchema,
);
