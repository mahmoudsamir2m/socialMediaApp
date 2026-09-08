jest.mock("../src/database/model/notification.model", () => ({
  NotificationModel: {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
  },
}));

jest.mock("../src/database/model/block.model", () => ({
  BlockModel: { exists: jest.fn() },
}));

jest.mock("../src/socket/socket.service", () => ({
  getIO: jest.fn(() => ({ to: jest.fn(() => ({ emit: jest.fn() })) })),
}));

import { BlockModel } from "../src/database/model/block.model";
import { NotificationModel } from "../src/database/model/notification.model";
import { NotificationType } from "../src/common/enums";
import notificationService from "../src/modules/notification/notification.service";

describe("NotificationService", () => {
  it("does not create a notification for the same user", async () => {
    await expect(
      notificationService.create({
        recipient: "user-1",
        actor: "user-1",
        type: NotificationType.Comment,
      }),
    ).resolves.toBeNull();
    expect(NotificationModel.create).not.toHaveBeenCalled();
  });

  it("does not notify blocked users", async () => {
    jest.mocked(BlockModel.exists).mockResolvedValue(true);

    await expect(
      notificationService.create({
        recipient: "user-1",
        actor: "user-2",
        type: NotificationType.Comment,
      }),
    ).resolves.toBeNull();
    expect(NotificationModel.create).not.toHaveBeenCalled();
  });

  it("creates a notification when users are not blocked", async () => {
    const notification = { _id: "notification-1" };
    jest.mocked(BlockModel.exists).mockResolvedValue(false);
    jest
      .mocked(NotificationModel.create)
      .mockResolvedValue(notification as never);

    await expect(
      notificationService.create({
        recipient: "user-1",
        actor: "user-2",
        type: NotificationType.Comment,
        entityId: "comment-1",
      }),
    ).resolves.toBe(notification);
  });
});
