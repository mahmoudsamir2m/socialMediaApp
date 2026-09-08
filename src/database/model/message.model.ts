import mongoose, { type Types } from "mongoose";

export enum MessageStatus {
  Sent = "sent",
  Delivered = "delivered",
  Read = "read",
}

export interface IMessage {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  content: string;
  type: "text" | "image" | "file";
  status: MessageStatus;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const messageSchema = new mongoose.Schema<IMessage>(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
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
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    type: { type: String, enum: ["text", "image", "file"], default: "text" },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.Sent,
    },
    readAt: Date,
  },
  { timestamps: true },
);

messageSchema.index({ conversation: 1, createdAt: -1, _id: -1 });
messageSchema.index({ receiver: 1, status: 1 });

export const MessageModel = mongoose.model<IMessage>("Message", messageSchema);
