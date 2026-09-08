import mongoose, { type Types } from "mongoose";

export interface IPostImage {
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
}

export interface IPost {
  author: Types.ObjectId;
  content?: string;
  images: IPostImage[];
  originalPost?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const imageSchema = new mongoose.Schema<IPostImage>(
  {
    secureUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    width: Number,
    height: Number,
  },
  { _id: false },
);

const postSchema = new mongoose.Schema<IPost>(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, trim: true, maxlength: 5000 },
    images: { type: [imageSchema], default: [] },
    originalPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: undefined,
      index: true,
    },
  },
  { timestamps: true },
);

postSchema.index({ createdAt: -1, _id: -1 });
postSchema.index({ author: 1, createdAt: -1 });

export const PostModel = mongoose.model<IPost>("Post", postSchema);
