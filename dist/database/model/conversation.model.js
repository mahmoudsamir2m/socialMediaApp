"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({ participants: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true }], participantKey: { type: String, required: true, unique: true }, lastMessage: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Message" }, lastMessageAt: Date }, { timestamps: true });
schema.index({ participants: 1, lastMessageAt: -1 });
exports.ConversationModel = mongoose_1.default.model("Conversation", schema);
