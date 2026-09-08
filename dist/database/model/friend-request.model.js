"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendRequestModel = exports.FriendRequestStatus = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var FriendRequestStatus;
(function (FriendRequestStatus) {
    FriendRequestStatus["Pending"] = "pending";
    FriendRequestStatus["Accepted"] = "accepted";
    FriendRequestStatus["Rejected"] = "rejected";
})(FriendRequestStatus || (exports.FriendRequestStatus = FriendRequestStatus = {}));
const schema = new mongoose_1.default.Schema({ sender: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true }, receiver: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true }, status: { type: String, enum: Object.values(FriendRequestStatus), default: FriendRequestStatus.Pending } }, { timestamps: true });
schema.index({ sender: 1, receiver: 1 }, { unique: true });
schema.index({ receiver: 1, status: 1, createdAt: -1 });
exports.FriendRequestModel = mongoose_1.default.model("FriendRequest", schema);
