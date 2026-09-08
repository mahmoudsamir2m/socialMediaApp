"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = exports.getIO = void 0;
const socket_io_1 = require("socket.io");
const token_service_1 = require("../common/services/token.service");
const chat_service_1 = __importDefault(require("../modules/chat/chat.service"));
let io;
const socketsByUser = new Map();
const getIO = () => {
    if (!io)
        throw new Error("Socket.IO is not initialized");
    return io;
};
exports.getIO = getIO;
const initializeSocket = (server) => {
    io = new socket_io_1.Server(server, { cors: { origin: "*" } });
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token ?? socket.handshake.headers.authorization?.replace("Bearer ", "");
            if (!token || typeof token !== "string")
                return next(new Error("Socket authentication is required"));
            const user = token_service_1.tokenService.verifyAccessToken(token);
            socket.userId = user.id;
            next();
        }
        catch {
            next(new Error("Invalid socket token"));
        }
    });
    io.on("connection", (socket) => {
        const authenticated = socket;
        const userSockets = socketsByUser.get(authenticated.userId) ?? new Set();
        const wasOffline = userSockets.size === 0;
        userSockets.add(authenticated.id);
        socketsByUser.set(authenticated.userId, userSockets);
        authenticated.join(`user:${authenticated.userId}`);
        if (wasOffline)
            io.emit("presence:online", { userId: authenticated.userId });
        authenticated.on("conversation:join", async (conversationId, ack) => {
            try {
                await chat_service_1.default.assertParticipant(conversationId, authenticated.userId);
                await authenticated.join(`conversation:${conversationId}`);
                ack?.({ ok: true });
            }
            catch (error) {
                ack?.({ ok: false, message: error instanceof Error ? error.message : "Unable to join conversation" });
            }
        });
        authenticated.on("conversation:leave", (conversationId) => authenticated.leave(`conversation:${conversationId}`));
        authenticated.on("typing:start", ({ conversationId }) => authenticated.to(`conversation:${conversationId}`).emit("typing:start", { conversationId, userId: authenticated.userId }));
        authenticated.on("typing:stop", ({ conversationId }) => authenticated.to(`conversation:${conversationId}`).emit("typing:stop", { conversationId, userId: authenticated.userId }));
        authenticated.on("conversation:create", async ({ receiverId }, ack) => {
            try {
                const conversation = await chat_service_1.default.createConversation(authenticated.userId, receiverId);
                authenticated.join(`conversation:${conversation._id}`);
                io.to(`user:${receiverId}`).emit("conversation:created", conversation);
                ack?.({ ok: true, conversation });
            }
            catch (error) {
                ack?.({ ok: false, message: error instanceof Error ? error.message : "Unable to create conversation" });
            }
        });
        authenticated.on("message:send", async ({ conversationId, content }, ack) => {
            try {
                if (!content?.trim())
                    throw new Error("Message content is required");
                const message = await chat_service_1.default.sendMessage(authenticated.userId, conversationId, content);
                io.to(`conversation:${conversationId}`).emit("message:new", message);
                io.to(`user:${message.receiver}`).emit("message:delivered", { messageId: message._id, conversationId });
                ack?.({ ok: true, message });
            }
            catch (error) {
                ack?.({ ok: false, message: error instanceof Error ? error.message : "Unable to send message" });
            }
        });
        authenticated.on("message:read", async ({ conversationId }, ack) => {
            try {
                const readAt = await chat_service_1.default.markRead(authenticated.userId, conversationId);
                authenticated.to(`conversation:${conversationId}`).emit("message:read", { conversationId, userId: authenticated.userId, readAt });
                ack?.({ ok: true, readAt });
            }
            catch (error) {
                ack?.({ ok: false, message: error instanceof Error ? error.message : "Unable to mark messages as read" });
            }
        });
        authenticated.on("disconnect", () => { const current = socketsByUser.get(authenticated.userId); if (!current)
            return; current.delete(authenticated.id); if (current.size === 0) {
            socketsByUser.delete(authenticated.userId);
            io.emit("presence:offline", { userId: authenticated.userId, lastSeen: new Date() });
        } });
    });
    return io;
};
exports.initializeSocket = initializeSocket;
