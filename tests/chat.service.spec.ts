jest.mock("../src/database/model/conversation.model", () => ({
  ConversationModel: { findOneAndUpdate: jest.fn() },
}));

jest.mock("../src/database/model/friend-request.model", () => ({
  FriendRequestModel: { exists: jest.fn() },
  FriendRequestStatus: { Accepted: "accepted" },
}));

jest.mock("../src/database/model/message.model", () => ({
  MessageModel: { create: jest.fn() },
  MessageStatus: { Sent: "sent", Read: "read" },
}));

jest.mock("../src/database/model/user.model", () => ({
  __esModule: true,
  default: { exists: jest.fn() },
}));

import { FriendRequestModel } from "../src/database/model/friend-request.model";
import UserModel from "../src/database/model/user.model";
import chatService from "../src/modules/chat/chat.service";

describe("ChatService", () => {
  it("rejects a conversation with yourself", async () => {
    await expect(
      chatService.createConversation("user-1", "user-1"),
    ).rejects.toMatchObject({
      status: 403,
      message: "You cannot start a conversation with yourself",
    });
  });

  it("requires an existing accepted friendship", async () => {
    jest.mocked(UserModel.exists).mockResolvedValue(true);
    jest.mocked(FriendRequestModel.exists).mockResolvedValue(false);

    await expect(
      chatService.createConversation("user-1", "user-2"),
    ).rejects.toMatchObject({
      status: 403,
      message: "Only accepted friends can chat",
    });
  });
});
