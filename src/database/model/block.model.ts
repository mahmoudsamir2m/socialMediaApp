import mongoose, { type Types } from "mongoose";

export interface IBlock {
  blocker: Types.ObjectId;
  blocked: Types.ObjectId;
  createdAt?: Date;
}

const blockSchema = new mongoose.Schema<IBlock>(
  {
    blocker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blocked: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });
blockSchema.index({ blocked: 1 });

export const BlockModel = mongoose.model<IBlock>("Block", blockSchema);
