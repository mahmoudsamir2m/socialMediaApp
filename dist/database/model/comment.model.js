"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    post: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    author: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, trim: true, required: true, maxlength: 2000 },
    parentComment: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Comment", default: undefined, index: true },
}, { timestamps: true });
schema.index({ post: 1, parentComment: 1, createdAt: -1 });
exports.CommentModel = mongoose_1.default.model("Comment", schema);
