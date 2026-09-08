jest.mock("../src/database/model/story.model", () => ({
  StoryModel: { create: jest.fn(), findOne: jest.fn(), findById: jest.fn() },
  StoryViewModel: {
    updateOne: jest.fn(),
    find: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

jest.mock("../src/common/services/image.service", () => ({
  imageService: { uploadImages: jest.fn(), deleteImages: jest.fn() },
}));

jest.mock("../src/modules/block/block.service", () => ({
  __esModule: true,
  default: { ids: jest.fn(), assertNotBlocked: jest.fn() },
}));

jest.mock("../src/modules/friend/friend.service", () => ({
  __esModule: true,
  default: { friendIds: jest.fn(), areFriends: jest.fn() },
}));

jest.mock("../src/modules/notification/notification.service", () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

import storyService from "../src/modules/story/story.service";

describe("StoryService", () => {
  it("requires an image when creating a story", async () => {
    await expect(
      storyService.create("user-1", undefined),
    ).rejects.toMatchObject({
      status: 403,
      message: "Story image is required",
    });
  });

  it("rejects an expired or missing story", async () => {
    const StoryModel = await import("../src/database/model/story.model");
    jest.mocked(StoryModel.StoryModel.findOne).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    } as never);

    await expect(
      storyService.getById("story-1", "user-1"),
    ).rejects.toMatchObject({
      status: 404,
      message: "Story not found",
    });
  });
});
