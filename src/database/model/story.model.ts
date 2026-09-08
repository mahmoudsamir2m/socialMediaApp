import mongoose, { type Types } from "mongoose";
import type { IPostImage } from "./post.model";

export interface IStory {
  author: Types.ObjectId;
  caption?: string;
  image: IPostImage;
  expiresAt: Date;
  createdAt?: Date;
}

const storySchema = new mongoose.Schema<IStory>(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    caption: { type: String, trim: true, maxlength: 500 },
    image: {
      secureUrl: { type: String, required: true },
      publicId: { type: String, required: true },
      width: Number,
      height: Number,
    },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const StoryModel = mongoose.model<IStory>("Story", storySchema);

export interface IStoryView {
  story: Types.ObjectId;
  user: Types.ObjectId;
  createdAt?: Date;
}

const storyViewSchema = new mongoose.Schema<IStoryView>(
  {
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

storyViewSchema.index({ story: 1, user: 1 }, { unique: true });

export const StoryViewModel = mongoose.model<IStoryView>(
  "StoryView",
  storyViewSchema,
);
