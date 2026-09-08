"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageModel = exports.MessageStatus = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["Sent"] = "sent";
    MessageStatus["Delivered"] = "delivered";
    MessageStatus["Read"] = "read";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
const schema = new mongoose_1.default.Schema({ conversation: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Conversation", required: true }, sender: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true }, receiver: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true }, content: { type: String, required: true, trim: true, maxlength: 5000 }, type: { type: String, enum: ["text", "image", "file"], default: "text" }, status: { type: String, enum: Object.values(MessageStatus), default: MessageStatus.Sent }, readAt: Date }, { timestamps: true });
schema.index({ conversation: 1, createdAt: -1, _id: -1 });
schema.index({ receiver: 1, status: 1 });
exports.MessageModel = mongoose_1.default.model("Message", schema);
