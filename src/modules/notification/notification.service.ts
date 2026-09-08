import { Types } from "mongoose";
import { NotificationType } from "../../common/enums";
import { NotificationModel } from "../../database/model/notification.model";
import { BlockModel } from "../../database/model/block.model";
import { getIO } from "../../socket/socket.service";

type CreateNotificationInput = {
  recipient: string;
  actor: string;
  type: NotificationType;
  entityId?: string;
  entityType?: string;
};

class NotificationService {
  async create(input: CreateNotificationInput) {
    if (input.recipient === input.actor) return null;

    const blocked = await BlockModel.exists({
      $or: [
        { blocker: input.recipient, blocked: input.actor },
        { blocker: input.actor, blocked: input.recipient },
      ],
    });
    if (blocked) return null;

    const notification = await NotificationModel.create({
      recipient: input.recipient,
      actor: input.actor,
      type: input.type,
      ...(input.entityId ? { entityId: input.entityId } : {}),
      ...(input.entityType ? { entityType: input.entityType } : {}),
    });

    try {
      getIO()
        .to(`user:${input.recipient}`)
        .emit("notification:new", notification);
    } catch {
      // Socket may not be initialized in some contexts
    }

    return notification;
  }

  async list(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      NotificationModel.find({ recipient: userId })
        .populate("actor", "firstName lastName profilePic")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      NotificationModel.countDocuments({ recipient: userId }),
      NotificationModel.countDocuments({ recipient: userId, read: false }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async unreadCount(userId: string) {
    return NotificationModel.countDocuments({
      recipient: userId,
      read: false,
    });
  }

  async markRead(userId: string, notificationId?: string) {
    const filter: Record<string, unknown> = { recipient: userId, read: false };
    if (notificationId) {
      filter._id = new Types.ObjectId(notificationId);
    }
    await NotificationModel.updateMany(filter, { read: true });
    return { message: "Notifications marked as read" };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
