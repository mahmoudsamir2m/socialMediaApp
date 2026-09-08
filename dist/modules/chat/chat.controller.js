"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sucsses_response_1 = require("../../common/exceptions/sucsses.response");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const chat_service_1 = __importDefault(require("./chat.service"));
const zod_1 = require("zod");
const id = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const conversationId = { params: zod_1.z.object({ conversationId: id }) };
const createConversation = { body: zod_1.z.object({ receiverId: id }) };
const history = { ...conversationId, query: zod_1.z.object({ cursor: id.optional(), limit: zod_1.z.coerce.number().int().min(1).max(100).default(30) }) };
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)(createConversation), async (req, res) => {
    const data = await chat_service_1.default.createConversation(req.user.id, req.body.receiverId);
    return (0, sucsses_response_1.SuccessResponse)({ res, status: 201, message: "Conversation created", data });
});
router.get("/", auth_middleware_1.authMiddleware, async (req, res) => (0, sucsses_response_1.SuccessResponse)({ res, message: "Conversations fetched", data: await chat_service_1.default.listConversations(req.user.id) }));
router.get("/:conversationId", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)(conversationId), async (req, res) => (0, sucsses_response_1.SuccessResponse)({ res, message: "Conversation fetched", data: await chat_service_1.default.getConversation(req.user.id, req.params.conversationId) }));
router.get("/:conversationId/messages", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)(history), async (req, res) => { const query = history.query.parse(req.query); return (0, sucsses_response_1.SuccessResponse)({ res, message: "Messages fetched", data: await chat_service_1.default.history(req.user.id, req.params.conversationId, query.cursor, query.limit) }); });
router.patch("/:conversationId/read", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validation)(conversationId), async (req, res) => (0, sucsses_response_1.SuccessResponse)({ res, message: "Messages marked as read", data: { readAt: await chat_service_1.default.markRead(req.user.id, req.params.conversationId) } }));
exports.default = router;
