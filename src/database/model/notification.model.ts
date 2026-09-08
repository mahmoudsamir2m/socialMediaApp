import mongoose, { type Types } from "mongoose";
import { NotificationType } from "../../common/enums";

export interface INotification {
  recipient: Types.ObjectId;
  actor: Types.ObjectId;
  type: NotificationType;
  entityId?: Types.ObjectId;
  entityType?: string;
  read: boolean;
  createdAt?: Date;
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    entityType: String,
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
