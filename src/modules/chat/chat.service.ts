import { Types } from "mongoose";
import {
  ForbiddenException,
  NotFoundException,
} from "../../common/exceptions/applications.exceptions";
import { ConversationModel } from "../../database/model/conversation.model";
import {
  FriendRequestModel,
  FriendRequestStatus,
} from "../../database/model/friend-request.model";
import {
  MessageModel,
  MessageStatus,
} from "../../database/model/message.model";
import UserModel from "../../database/model/user.model";

class ChatService {
  private key(a: string, b: string) {
    return [a, b].sort().join(":");
  }
  async areFriends(a: string, b: string) {
    return Boolean(
      await FriendRequestModel.exists({
        status: FriendRequestStatus.Accepted,
        $or: [
          { sender: a, receiver: b },
          { sender: b, receiver: a },
        ],
      }),
    );
  }
  async createConversation(userId: string, receiverId: string) {
    if (userId === receiverId)
      throw new ForbiddenException(
        "You cannot start a conversation with yourself",
      );
    if (!(await UserModel.exists({ _id: receiverId })))
      throw new NotFoundException("User not found");
    if (!(await this.areFriends(userId, receiverId)))
      throw new ForbiddenException("Only accepted friends can chat");
    return ConversationModel.findOneAndUpdate(
      { participantKey: this.key(userId, receiverId) },
      {
        $setOnInsert: {
          participants: [userId, receiverId],
          participantKey: this.key(userId, receiverId),
        },
      },
      { new: true, upsert: true },
    );
  }
  async assertParticipant(conversationId: string, userId: string) {
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participants: userId,
    });
    if (!conversation)
      throw new ForbiddenException(
        "You are not a participant in this conversation",
      );
    return conversation;
  }
  async sendMessage(userId: string, conversationId: string, content: string) {
    const conversation = await this.assertParticipant(conversationId, userId);
    const receiver = conversation.participants.find(
      (id) => id.toString() !== userId,
    );
    if (!receiver)
      throw new ForbiddenException("Invalid conversation participants");
    if (!(await this.areFriends(userId, receiver.toString())))
      throw new ForbiddenException("Only accepted friends can chat");
    const message = await MessageModel.create({
      conversation: conversation._id,
      sender: userId,
      receiver,
      content,
      status: MessageStatus.Sent,
    });
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt ?? new Date();
    await conversation.save();
    return message;
  }
  async markRead(userId: string, conversationId: string) {
    await this.assertParticipant(conversationId, userId);
    const now = new Date();
    await MessageModel.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        status: { $ne: MessageStatus.Read },
      },
      { status: MessageStatus.Read, readAt: now },
    );
    return now;
  }
  async history(
    userId: string,
    conversationId: string,
    cursor?: string,
    limit = 30,
  ) {
    await this.assertParticipant(conversationId, userId);
    const filter: Record<string, unknown> = {
      conversation: new Types.ObjectId(conversationId),
    };
    if (cursor && Types.ObjectId.isValid(cursor))
      filter._id = { $lt: new Types.ObjectId(cursor) };
    const messages = await MessageModel.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1);
    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();
    return {
      messages: messages.reverse(),
      nextCursor: hasMore ? messages[0]?._id.toString() : undefined,
      hasMore,
    };
  }
  async listConversations(userId: string) {
    return ConversationModel.find({ participants: userId })
      .populate("participants", "firstName lastName profilePic")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1, updatedAt: -1 });
  }
  async getConversation(userId: string, conversationId: string) {
    await this.assertParticipant(conversationId, userId);
    return ConversationModel.findById(conversationId)
      .populate("participants", "firstName lastName profilePic")
      .populate("lastMessage");
  }
}
export default new ChatService();
