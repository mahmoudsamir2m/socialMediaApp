"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentLikeModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    comment: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Comment", required: true },
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
schema.index({ comment: 1, user: 1 }, { unique: true });
exports.CommentLikeModel = mongoose_1.default.model("CommentLike", schema);
