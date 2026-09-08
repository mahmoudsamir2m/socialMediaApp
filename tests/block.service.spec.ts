jest.mock("../src/database/model/block.model", () => ({
  BlockModel: {
    create: jest.fn(),
    exists: jest.fn(),
    find: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}));

jest.mock("../src/database/model/friend-request.model", () => ({
  FriendRequestModel: { deleteMany: jest.fn() },
  FriendRequestStatus: { Pending: "pending", Accepted: "accepted" },
}));

jest.mock("../src/database/model/user.model", () => ({
  __esModule: true,
  default: { exists: jest.fn() },
}));

import { BlockModel } from "../src/database/model/block.model";
import UserModel from "../src/database/model/user.model";
import blockService from "../src/modules/block/block.service";

describe("BlockService", () => {
  it("rejects blocking yourself", async () => {
    await expect(blockService.block("user-1", "user-1")).rejects.toMatchObject({
      status: 403,
      message: "You cannot block yourself",
    });
  });

  it("rejects blocking a missing user", async () => {
    jest.mocked(UserModel.exists).mockResolvedValue(false);

    await expect(blockService.block("user-1", "user-2")).rejects.toMatchObject({
      status: 404,
      message: "User not found",
    });
  });

  it("creates a block and removes the friendship", async () => {
    jest.mocked(UserModel.exists).mockResolvedValue(true);
    jest.mocked(BlockModel.create).mockResolvedValue({});

    await expect(blockService.block("user-1", "user-2")).resolves.toEqual({
      message: "User blocked",
    });
    expect(BlockModel.create).toHaveBeenCalledWith({
      blocker: "user-1",
      blocked: "user-2",
    });
  });
});
