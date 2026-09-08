"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const applications_exceptions_1 = require("../../common/exceptions/applications.exceptions");
const friend_request_model_1 = require("../../database/model/friend-request.model");
const user_model_1 = __importDefault(require("../../database/model/user.model"));
class FriendService {
    async send(sender, receiver) { if (sender === receiver)
        throw new applications_exceptions_1.ForbiddenException("You cannot add yourself"); if (!await user_model_1.default.exists({ _id: receiver }))
        throw new applications_exceptions_1.NotFoundException("User not found"); const current = await friend_request_model_1.FriendRequestModel.findOne({ $or: [{ sender, receiver }, { sender: receiver, receiver: sender }] }); if (current?.status === friend_request_model_1.FriendRequestStatus.Accepted)
        throw new applications_exceptions_1.ConflictException("Users are already friends"); if (current?.status === friend_request_model_1.FriendRequestStatus.Pending)
        throw new applications_exceptions_1.ConflictException("A friend request already exists"); return friend_request_model_1.FriendRequestModel.findOneAndUpdate({ sender, receiver }, { status: friend_request_model_1.FriendRequestStatus.Pending }, { new: true, upsert: true }); }
    async accept(id, user) { const request = await friend_request_model_1.FriendRequestModel.findOne({ _id: id, receiver: user, status: friend_request_model_1.FriendRequestStatus.Pending }); if (!request)
        throw new applications_exceptions_1.NotFoundException("Pending friend request not found"); request.status = friend_request_model_1.FriendRequestStatus.Accepted; return request.save(); }
    async reject(id, user) { const request = await friend_request_model_1.FriendRequestModel.findOne({ _id: id, receiver: user, status: friend_request_model_1.FriendRequestStatus.Pending }); if (!request)
        throw new applications_exceptions_1.NotFoundException("Pending friend request not found"); request.status = friend_request_model_1.FriendRequestStatus.Rejected; return request.save(); }
    async cancel(id, user) { const request = await friend_request_model_1.FriendRequestModel.findOneAndDelete({ _id: id, sender: user, status: friend_request_model_1.FriendRequestStatus.Pending }); if (!request)
        throw new applications_exceptions_1.NotFoundException("Sent friend request not found"); return { message: "Friend request cancelled" }; }
    async remove(user, friend) { const request = await friend_request_model_1.FriendRequestModel.findOneAndDelete({ status: friend_request_model_1.FriendRequestStatus.Accepted, $or: [{ sender: user, receiver: friend }, { sender: friend, receiver: user }] }); if (!request)
        throw new applications_exceptions_1.NotFoundException("Friendship not found"); return { message: "Friend removed" }; }
    async status(user, other) { const request = await friend_request_model_1.FriendRequestModel.findOne({ $or: [{ sender: user, receiver: other }, { sender: other, receiver: user }] }); if (!request)
        return { status: "none" }; if (request.status === friend_request_model_1.FriendRequestStatus.Accepted)
        return { status: "accepted" }; if (request.status === friend_request_model_1.FriendRequestStatus.Rejected)
        return { status: "rejected" }; return { status: request.sender.toString() === user ? "pending_sent" : "pending_received", requestId: request._id }; }
    async list(user, kind) { const filter = kind === "received" ? { receiver: user, status: friend_request_model_1.FriendRequestStatus.Pending } : kind === "sent" ? { sender: user, status: friend_request_model_1.FriendRequestStatus.Pending } : { status: friend_request_model_1.FriendRequestStatus.Accepted, $or: [{ sender: user }, { receiver: user }] }; return friend_request_model_1.FriendRequestModel.find(filter).populate("sender receiver", "firstName lastName profilePic").sort({ createdAt: -1 }); }
}
exports.default = new FriendService();
