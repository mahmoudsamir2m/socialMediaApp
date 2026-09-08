"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const applications_exceptions_1 = require("../../../common/exceptions/applications.exceptions");
const sucsses_response_1 = require("../../../common/exceptions/sucsses.response");
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const validation_middleware_1 = require("../../../middleware/validation.middleware");
const comment_service_1 = __importDefault(require("../comments/comment.service"));
const post_like_service_1 = __importDefault(require("../post-likes/post-like.service"));
const post_service_1 = __importDefault(require("./post.service"));
const post_share_service_1 = __importDefault(require("../shares/post-share.service"));
const post_validation_1 = require("./post.validation");
const uploadedFiles = (req) => {
    return (Array.isArray(req.files) ? req.files : []);
};
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            cb(new applications_exceptions_1.BadRequestException("Only image files are allowed"));
            return;
        }
        cb(null, true);
    },
});
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.authMiddleware, upload.array("images", 10), (0, validation_middleware_1.validation)(post_validation_1.createPostSchema), async (req, res) => {
    const data = await post_service_1.default.create(req.user.id, req.body, uploadedFiles(req));
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Post created", status: 201, data });
});
router.get("/", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)(post_validation_1.feedSchema), async (req, res) => {
    const query = post_validation_1.feedSchema.query.parse(req.query);
    const data = await post_service_1.default.getFeed(query, req.user.id);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Posts fetched", status: 200, data });
});
router.get("/:id", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)(post_validation_1.postIdSchema), async (req, res) => {
    const data = await post_service_1.default.getById(req.params.id, req.user.id);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Post fetched", status: 200, data });
});
router.patch("/:id", auth_middleware_1.authMiddleware, upload.array("images", 10), (0, validation_middleware_1.validation)({ ...post_validation_1.postIdSchema, ...post_validation_1.updatePostSchema }), async (req, res) => {
    const data = await post_service_1.default.update(req.params.id, req.user.id, req.body, uploadedFiles(req));
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Post updated", status: 200, data });
});
router.delete("/:id", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)(post_validation_1.postIdSchema), async (req, res) => {
    const data = await post_service_1.default.delete(req.params.id, req.user.id);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Post deleted", status: 200, data });
});
router.post("/:id/like", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)(post_validation_1.postIdSchema), async (req, res) => {
    const data = await post_like_service_1.default.like(req.params.id, req.user.id);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Post liked", status: 201, data });
});
router.delete("/:id/like", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)(post_validation_1.postIdSchema), async (req, res) => {
    const data = await post_like_service_1.default.unlike(req.params.id, req.user.id);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Post unliked", status: 200, data });
});
router.post("/:id/share", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)({ ...post_validation_1.postIdSchema, ...post_validation_1.createPostSchema }), async (req, res) => {
    const data = await post_share_service_1.default.share(req.params.id, req.user.id, req.body.content);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Post shared", status: 201, data });
});
router.post("/:postId/comments", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)({ ...post_validation_1.postCommentIdSchema, ...post_validation_1.commentSchema }), async (req, res) => {
    const data = await comment_service_1.default.add(req.params.postId, req.user.id, req.body);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Comment created", status: 201, data });
});
router.get("/:postId/comments", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)(post_validation_1.commentsSchema), async (req, res) => {
    const query = post_validation_1.commentsSchema.query.parse(req.query);
    const data = await comment_service_1.default.list(req.params.postId, query, req.user.id);
    return (0, sucsses_response_1.SuccessResponse)({ res, message: "Comments fetched", status: 200, data });
});
exports.default = router;
