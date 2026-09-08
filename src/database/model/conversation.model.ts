import mongoose, { type Types } from "mongoose";

export interface IConversation {
  participants: Types.ObjectId[];
  participantKey: string;
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const conversationSchema = new mongoose.Schema<IConversation>(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    participantKey: { type: String, required: true, unique: true },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    lastMessageAt: Date,
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

export const ConversationModel = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema,
);
