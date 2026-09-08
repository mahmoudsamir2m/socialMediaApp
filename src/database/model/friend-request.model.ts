import mongoose, { type Types } from "mongoose";

export enum FriendRequestStatus {
  Pending = "pending",
  Accepted = "accepted",
  Rejected = "rejected",
}

export interface IFriendRequest {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  status: FriendRequestStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const friendRequestSchema = new mongoose.Schema<IFriendRequest>(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(FriendRequestStatus),
      default: FriendRequestStatus.Pending,
    },
  },
  { timestamps: true },
);

friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
friendRequestSchema.index({ receiver: 1, status: 1, createdAt: -1 });

export const FriendRequestModel = mongoose.model<IFriendRequest>(
  "FriendRequest",
  friendRequestSchema,
);
