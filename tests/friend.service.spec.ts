jest.mock("../src/database/model/friend-request.model", () => ({
  FriendRequestModel: { findOne: jest.fn() },
  FriendRequestStatus: {
    Pending: "pending",
    Accepted: "accepted",
    Rejected: "rejected",
  },
}));

jest.mock("../src/database/model/user.model", () => ({
  __esModule: true,
  default: { exists: jest.fn() },
}));

jest.mock("../src/modules/block/block.service", () => ({
  __esModule: true,
  default: { assertNotBlocked: jest.fn() },
}));

jest.mock("../src/modules/notification/notification.service", () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

import { FriendRequestModel } from "../src/database/model/friend-request.model";
import friendService from "../src/modules/friend/friend.service";

describe("FriendService", () => {
  it("creates a stable pair key regardless of argument order", () => {
    expect(friendService.pairKey("z-user", "a-user")).toBe("a-user:z-user");
  });

  it("returns none when no relationship exists", async () => {
    jest.mocked(FriendRequestModel.findOne).mockResolvedValue(null);

    await expect(friendService.status("user-1", "user-2")).resolves.toEqual({
      status: "none",
    });
  });

  it("identifies the direction of a pending request", async () => {
    jest.mocked(FriendRequestModel.findOne).mockResolvedValue({
      sender: "user-1",
      receiver: "user-2",
      status: "pending",
      _id: "request-1",
    } as never);

    await expect(friendService.status("user-1", "user-2")).resolves.toEqual({
      status: "pending_sent",
      requestId: "request-1",
    });
  });
});
