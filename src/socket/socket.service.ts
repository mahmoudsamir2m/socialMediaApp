import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { tokenService } from "../common/services/token.service";
import chatService from "../modules/chat/chat.service";

export type AuthenticatedSocket = Socket & { userId: string };
let io: Server | undefined;
const socketsByUser = new Map<string, Set<string>>();

export const getIO = () => {
  if (!io) throw new Error("Socket.IO is not initialized");
  return io;
};

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, { cors: { origin: "*" } });
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ??
        socket.handshake.headers.authorization?.replace("Bearer ", "");
      if (!token || typeof token !== "string")
        return next(new Error("Socket authentication is required"));
      const user = tokenService.verifyAccessToken(token);
      (socket as AuthenticatedSocket).userId = user.id;
      next();
    } catch {
      next(new Error("Invalid socket token"));
    }
  });
  io.on("connection", (socket) => {
    const authenticated = socket as AuthenticatedSocket;
    const userSockets =
      socketsByUser.get(authenticated.userId) ?? new Set<string>();
    const wasOffline = userSockets.size === 0;
    userSockets.add(authenticated.id);
    socketsByUser.set(authenticated.userId, userSockets);
    authenticated.join(`user:${authenticated.userId}`);
    if (wasOffline)
      io!.emit("presence:online", { userId: authenticated.userId });
    authenticated.on(
      "conversation:join",
      async (conversationId: string, ack?: (result: unknown) => void) => {
        try {
          await chatService.assertParticipant(
            conversationId,
            authenticated.userId,
          );
          await authenticated.join(`conversation:${conversationId}`);
          ack?.({ ok: true });
        } catch (error) {
          ack?.({
            ok: false,
            message:
              error instanceof Error
                ? error.message
                : "Unable to join conversation",
          });
        }
      },
    );
    authenticated.on("conversation:leave", (conversationId: string) =>
      authenticated.leave(`conversation:${conversationId}`),
    );
    authenticated.on(
      "typing:start",
      ({ conversationId }: { conversationId: string }) =>
        authenticated
          .to(`conversation:${conversationId}`)
          .emit("typing:start", {
            conversationId,
            userId: authenticated.userId,
          }),
    );
    authenticated.on(
      "typing:stop",
      ({ conversationId }: { conversationId: string }) =>
        authenticated
          .to(`conversation:${conversationId}`)
          .emit("typing:stop", {
            conversationId,
            userId: authenticated.userId,
          }),
    );
    authenticated.on(
      "conversation:create",
      async (
        { receiverId }: { receiverId: string },
        ack?: (result: unknown) => void,
      ) => {
        try {
          const conversation = await chatService.createConversation(
            authenticated.userId,
            receiverId,
          );
          authenticated.join(`conversation:${conversation._id}`);
          io!
            .to(`user:${receiverId}`)
            .emit("conversation:created", conversation);
          ack?.({ ok: true, conversation });
        } catch (error) {
          ack?.({
            ok: false,
            message:
              error instanceof Error
                ? error.message
                : "Unable to create conversation",
          });
        }
      },
    );
    authenticated.on(
      "message:send",
      async (
        {
          conversationId,
          content,
        }: { conversationId: string; content: string },
        ack?: (result: unknown) => void,
      ) => {
        try {
          if (!content?.trim()) throw new Error("Message content is required");
          const message = await chatService.sendMessage(
            authenticated.userId,
            conversationId,
            content,
          );
          io!.to(`conversation:${conversationId}`).emit("message:new", message);
          io!
            .to(`user:${message.receiver}`)
            .emit("message:delivered", {
              messageId: message._id,
              conversationId,
            });
          ack?.({ ok: true, message });
        } catch (error) {
          ack?.({
            ok: false,
            message:
              error instanceof Error ? error.message : "Unable to send message",
          });
        }
      },
    );
    authenticated.on(
      "message:read",
      async (
        { conversationId }: { conversationId: string },
        ack?: (result: unknown) => void,
      ) => {
        try {
          const readAt = await chatService.markRead(
            authenticated.userId,
            conversationId,
          );
          authenticated
            .to(`conversation:${conversationId}`)
            .emit("message:read", {
              conversationId,
              userId: authenticated.userId,
              readAt,
            });
          ack?.({ ok: true, readAt });
        } catch (error) {
          ack?.({
            ok: false,
            message:
              error instanceof Error
                ? error.message
                : "Unable to mark messages as read",
          });
        }
      },
    );
    authenticated.on("disconnect", () => {
      const current = socketsByUser.get(authenticated.userId);
      if (!current) return;
      current.delete(authenticated.id);
      if (current.size === 0) {
        socketsByUser.delete(authenticated.userId);
        io!.emit("presence:offline", {
          userId: authenticated.userId,
          lastSeen: new Date(),
        });
      }
    });
  });
  return io;
};
