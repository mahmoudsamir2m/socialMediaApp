"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const applications_exceptions_1 = require("../../../common/exceptions/applications.exceptions");
const sucsses_response_1 = require("../../../common/exceptions/sucsses.response");
const comment_model_1 = require("../../../database/model/comment.model");
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const validation_middleware_1 = require("../../../middleware/validation.middleware");
const comment_like_service_1 = __importDefault(require("../comment-likes/comment-like.service"));
const comment_service_1 = __importDefault(require("./comment.service"));
const post_validation_1 = require("../posts/post.validation");
const router = (0, express_1.Router)();
router.patch("/:commentId", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)({ ...post_validation_1.commentIdSchema, ...post_validation_1.commentSchema }), async (req, res) => {
    const data = await comment_service_1.default.update(req.params.commentId, req.user.id, req.body.content);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Comment updated", status: 200, data });
});
router.delete("/:commentId", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)(post_validation_1.commentIdSchema), async (req, res) => {
    const data = await comment_service_1.default.delete(req.params.commentId, req.user.id);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Comment deleted", status: 200, data });
});
router.post("/:commentId/replies", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)({ ...post_validation_1.commentIdSchema, ...post_validation_1.commentSchema }), async (req, res) => {
    const comment = await comment_model_1.CommentModel.findById(req.params.commentId);
    if (!comment) {
        throw new applications_exceptions_1.BadRequestException("Comment not found");
    }
    const data = await comment_service_1.default.add(comment.post.toString(), req.user.id, req.body, req.params.commentId);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Reply created", status: 201, data });
});
router.get("/:commentId/replies", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)(post_validation_1.repliesSchema), async (req, res) => {
    const query = post_validation_1.repliesSchema.query.parse(req.query);
    const data = await comment_service_1.default.replies(req.params.commentId, query, req.user.id);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Replies fetched", status: 200, data });
});
router.post("/:commentId/like", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)(post_validation_1.commentIdSchema), async (req, res) => {
    const data = await comment_like_service_1.default.like(req.params.commentId, req.user.id);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Comment liked", status: 201, data });
});
router.delete("/:commentId/like", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)(post_validation_1.commentIdSchema), async (req, res) => {
    const data = await comment_like_service_1.default.unlike(req.params.commentId, req.user.id);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Comment unliked", status: 200, data });
});
exports.default = router;
