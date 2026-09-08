"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const applications_exceptions_1 = require("../../common/exceptions/applications.exceptions");
const conversation_model_1 = require("../../database/model/conversation.model");
const friend_request_model_1 = require("../../database/model/friend-request.model");
const message_model_1 = require("../../database/model/message.model");
const user_model_1 = __importDefault(require("../../database/model/user.model"));
class ChatService {
    key(a, b) { return [a, b].sort().join(":"); }
    async areFriends(a, b) { return Boolean(await friend_request_model_1.FriendRequestModel.exists({ status: friend_request_model_1.FriendRequestStatus.Accepted, $or: [{ sender: a, receiver: b }, { sender: b, receiver: a }] })); }
    async createConversation(userId, receiverId) {
        if (userId === receiverId)
            throw new applications_exceptions_1.ForbiddenException("You cannot start a conversation with yourself");
        if (!await user_model_1.default.exists({ _id: receiverId }))
            throw new applications_exceptions_1.NotFoundException("User not found");
        if (!await this.areFriends(userId, receiverId))
            throw new applications_exceptions_1.ForbiddenException("Only accepted friends can chat");
        return conversation_model_1.ConversationModel.findOneAndUpdate({ participantKey: this.key(userId, receiverId) }, { $setOnInsert: { participants: [userId, receiverId], participantKey: this.key(userId, receiverId) } }, { new: true, upsert: true });
    }
    async assertParticipant(conversationId, userId) {
        const conversation = await conversation_model_1.ConversationModel.findOne({ _id: conversationId, participants: userId });
        if (!conversation)
            throw new applications_exceptions_1.ForbiddenException("You are not a participant in this conversation");
        return conversation;
    }
    async sendMessage(userId, conversationId, content) {
        const conversation = await this.assertParticipant(conversationId, userId);
        const receiver = conversation.participants.find((id) => id.toString() !== userId);
        if (!receiver)
            throw new applications_exceptions_1.ForbiddenException("Invalid conversation participants");
        if (!await this.areFriends(userId, receiver.toString()))
            throw new applications_exceptions_1.ForbiddenException("Only accepted friends can chat");
        const message = await message_model_1.MessageModel.create({ conversation: conversation._id, sender: userId, receiver, content, status: message_model_1.MessageStatus.Sent });
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = message.createdAt ?? new Date();
        await conversation.save();
        return message;
    }
    async markRead(userId, conversationId) {
        await this.assertParticipant(conversationId, userId);
        const now = new Date();
        await message_model_1.MessageModel.updateMany({ conversation: conversationId, receiver: userId, status: { $ne: message_model_1.MessageStatus.Read } }, { status: message_model_1.MessageStatus.Read, readAt: now });
        return now;
    }
    async history(userId, conversationId, cursor, limit = 30) {
        await this.assertParticipant(conversationId, userId);
        const filter = { conversation: new mongoose_1.Types.ObjectId(conversationId) };
        if (cursor && mongoose_1.Types.ObjectId.isValid(cursor))
            filter._id = { $lt: new mongoose_1.Types.ObjectId(cursor) };
        const messages = await message_model_1.MessageModel.find(filter).sort({ _id: -1 }).limit(limit + 1);
        const hasMore = messages.length > limit;
        if (hasMore)
            messages.pop();
        return { messages: messages.reverse(), nextCursor: hasMore ? messages[0]?._id.toString() : undefined, hasMore };
    }
    async listConversations(userId) {
        return conversation_model_1.ConversationModel.find({ participants: userId }).populate("participants", "firstName lastName profilePic").populate("lastMessage").sort({ lastMessageAt: -1, updatedAt: -1 });
    }
    async getConversation(userId, conversationId) {
        await this.assertParticipant(conversationId, userId);
        return conversation_model_1.ConversationModel.findById(conversationId).populate("participants", "firstName lastName profilePic").populate("lastMessage");
    }
}
exports.default = new ChatService();
