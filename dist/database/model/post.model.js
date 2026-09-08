"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const imageSchema = new mongoose_1.default.Schema({ secureUrl: { type: String, required: true }, publicId: { type: String, required: true }, width: Number, height: Number }, { _id: false });
const postSchema = new mongoose_1.default.Schema({
    author: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, trim: true, maxlength: 5000 },
    images: { type: [imageSchema], default: [] },
    originalPost: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Post", default: undefined, index: true },
}, { timestamps: true });
postSchema.index({ createdAt: -1, _id: -1 });
postSchema.index({ author: 1, createdAt: -1 });
exports.PostModel = mongoose_1.default.model("Post", postSchema);
