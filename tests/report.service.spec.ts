jest.mock("../src/database/model/report.model", () => ({
  ReportModel: { create: jest.fn(), find: jest.fn(), findByIdAndUpdate: jest.fn() },
}));

jest.mock("../src/database/model/user.model", () => ({
  __esModule: true,
  default: { exists: jest.fn() },
}));
jest.mock("../src/database/model/post.model", () => ({ PostModel: { exists: jest.fn() } }));
jest.mock("../src/database/model/comment.model", () => ({ CommentModel: { exists: jest.fn() } }));
jest.mock("../src/database/model/story.model", () => ({ StoryModel: { exists: jest.fn() } }));
jest.mock("../src/database/model/message.model", () => ({ MessageModel: { exists: jest.fn() } }));

import { RoleEnum } from "../src/common/enums";
import reportService from "../src/modules/report/report.service";

describe("ReportService", () => {
  it("does not expose all reports to non-admin users", async () => {
    await expect(reportService.list(RoleEnum.User)).rejects.toMatchObject({
      status: 404,
      message: "Reported content not found",
    });
  });
});
