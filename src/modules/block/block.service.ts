import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "../../common/exceptions/applications.exceptions";
import { BlockModel } from "../../database/model/block.model";
import {
  FriendRequestModel,
  FriendRequestStatus,
} from "../../database/model/friend-request.model";
import UserModel from "../../database/model/user.model";

class BlockService {
  async ids(userId: string) {
    const rows = await BlockModel.find({
      $or: [{ blocker: userId }, { blocked: userId }],
    }).lean();
    return [
      ...new Set(
        rows.map((row) =>
          row.blocker.toString() === userId
            ? row.blocked.toString()
            : row.blocker.toString(),
        ),
      ),
    ];
  }

  async isBlocked(a: string, b: string) {
    return Boolean(
      await BlockModel.exists({
        $or: [
          { blocker: a, blocked: b },
          { blocker: b, blocked: a },
        ],
      }),
    );
  }

  async assertNotBlocked(a: string, b: string) {
    if (await this.isBlocked(a, b)) {
      throw new ForbiddenException("You cannot interact with this user");
    }
  }

  async block(blocker: string, blocked: string) {
    if (blocker === blocked) {
      throw new ForbiddenException("You cannot block yourself");
    }
    if (!(await UserModel.exists({ _id: blocked }))) {
      throw new NotFoundException("User not found");
    }
    try {
      await BlockModel.create({ blocker, blocked });
    } catch (error: unknown) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException("User is already blocked");
      }
      throw error;
    }

    await FriendRequestModel.deleteMany({
      $or: [
        { sender: blocker, receiver: blocked },
        { sender: blocked, receiver: blocker },
      ],
    });

    return { message: "User blocked" };
  }

  async unblock(blocker: string, blocked: string) {
    const removed = await BlockModel.findOneAndDelete({ blocker, blocked });
    if (!removed) {
      throw new NotFoundException("Block not found");
    }
    return { message: "User unblocked" };
  }

  async list(userId: string) {
    return BlockModel.find({ blocker: userId })
      .populate("blocked", "firstName lastName profilePic")
      .sort({ createdAt: -1 });
  }
}

export const blockService = new BlockService();
export default blockService;
