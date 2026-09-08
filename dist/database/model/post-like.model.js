"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostLikeModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    post: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Post", required: true },
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
schema.index({ post: 1, user: 1 }, { unique: true });
schema.index({ user: 1, createdAt: -1 });
exports.PostLikeModel = mongoose_1.default.model("PostLike", schema);
