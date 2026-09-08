import mongoose, { type Types } from "mongoose";

export interface IPostLike {
  post: Types.ObjectId;
  user: Types.ObjectId;
  createdAt?: Date;
}

const postLikeSchema = new mongoose.Schema<IPostLike>(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

postLikeSchema.index({ post: 1, user: 1 }, { unique: true });
postLikeSchema.index({ user: 1, createdAt: -1 });

export const PostLikeModel = mongoose.model<IPostLike>(
  "PostLike",
  postLikeSchema,
);
