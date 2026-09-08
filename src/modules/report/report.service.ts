import {
  ConflictException,
  NotFoundException,
} from "../../common/exceptions/applications.exceptions";
import { ReportStatus, ReportTargetType, RoleEnum } from "../../common/enums";
import { ReportModel } from "../../database/model/report.model";
import UserModel from "../../database/model/user.model";
import { PostModel } from "../../database/model/post.model";
import { CommentModel } from "../../database/model/comment.model";
import { StoryModel } from "../../database/model/story.model";
import { MessageModel } from "../../database/model/message.model";

class ReportService {
  private async assertTargetExists(type: ReportTargetType, id: string) {
    const exists =
      type === ReportTargetType.User
        ? await UserModel.exists({ _id: id })
        : type === ReportTargetType.Post
          ? await PostModel.exists({ _id: id })
          : type === ReportTargetType.Comment
            ? await CommentModel.exists({ _id: id })
            : type === ReportTargetType.Story
              ? await StoryModel.exists({ _id: id })
              : await MessageModel.exists({ _id: id });
    if (!exists) throw new NotFoundException("Reported content not found");
  }

  async create(
    reporter: string,
    data: { targetType: ReportTargetType; targetId: string; reason: string },
  ) {
    await this.assertTargetExists(data.targetType, data.targetId);
    try {
      return await ReportModel.create({
        reporter,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
      });
    } catch (error: unknown) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException("You already reported this content");
      }
      throw error;
    }
  }

  async mine(userId: string) {
    return ReportModel.find({ reporter: userId }).sort({ createdAt: -1 });
  }

  async list(role: RoleEnum) {
    if (role !== RoleEnum.Admin) {
      throw new NotFoundException("Reported content not found");
    }
    return ReportModel.find()
      .populate("reporter", "firstName lastName profilePic email")
      .sort({ createdAt: -1 });
  }

  async updateStatus(reportId: string, status: ReportStatus) {
    const report = await ReportModel.findByIdAndUpdate(
      reportId,
      { status },
      { new: true },
    );
    if (!report) throw new NotFoundException("Report not found");
    return report;
  }
}

export default new ReportService();
