import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "../../common/exceptions/applications.exceptions";
import { NotificationType } from "../../common/enums";
import {
  FriendRequestModel,
  FriendRequestStatus,
} from "../../database/model/friend-request.model";
import UserModel from "../../database/model/user.model";
import blockService from "../block/block.service";
import notificationService from "../notification/notification.service";

class FriendService {
  pairKey(a: string, b: string) {
    return [a, b].sort().join(":");
  }

  async friendIds(userId: string) {
    const rows = await FriendRequestModel.find({
      status: FriendRequestStatus.Accepted,
      $or: [{ sender: userId }, { receiver: userId }],
    }).lean();
    return rows.map((row) =>
      row.sender.toString() === userId
        ? row.receiver.toString()
        : row.sender.toString(),
    );
  }

  async areFriends(a: string, b: string) {
    return Boolean(
      await FriendRequestModel.exists({
        status: FriendRequestStatus.Accepted,
        $or: [
          { pairKey: this.pairKey(a, b) },
          { sender: a, receiver: b },
          { sender: b, receiver: a },
        ],
      }),
    );
  }

  async friendsCount(userId: string) {
    return FriendRequestModel.countDocuments({
      status: FriendRequestStatus.Accepted,
      $or: [{ sender: userId }, { receiver: userId }],
    });
  }

  async send(sender: string, receiver: string) {
    if (sender === receiver)
      throw new ForbiddenException("You cannot add yourself");
    if (!(await UserModel.exists({ _id: receiver })))
      throw new NotFoundException("User not found");
    await blockService.assertNotBlocked(sender, receiver);

    const pairKey = this.pairKey(sender, receiver);
    const current = await FriendRequestModel.findOne({
      $or: [
        { pairKey },
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    });
    if (current?.status === FriendRequestStatus.Accepted)
      throw new ConflictException("Users are already friends");
    if (current?.status === FriendRequestStatus.Pending)
      throw new ConflictException("A friend request already exists");

    const request = current
      ? await FriendRequestModel.findByIdAndUpdate(
          current._id,
          {
            sender,
            receiver,
            pairKey,
            status: FriendRequestStatus.Pending,
          },
          { new: true },
        )
      : await FriendRequestModel.create({
          sender,
          receiver,
          pairKey,
          status: FriendRequestStatus.Pending,
        });

    await notificationService.create({
      recipient: receiver,
      actor: sender,
      type: NotificationType.FriendRequest,
      entityId: request!._id.toString(),
      entityType: "friend_request",
    });
    return request;
  }

  async accept(id: string, user: string) {
    const request = await FriendRequestModel.findOne({
      _id: id,
      receiver: user,
      status: FriendRequestStatus.Pending,
    });
    if (!request)
      throw new NotFoundException("Pending friend request not found");
    request.status = FriendRequestStatus.Accepted;
    await request.save();
    await notificationService.create({
      recipient: request.sender.toString(),
      actor: user,
      type: NotificationType.FriendAccept,
      entityId: request._id.toString(),
      entityType: "friend_request",
    });
    return request;
  }

  async reject(id: string, user: string) {
    const request = await FriendRequestModel.findOne({
      _id: id,
      receiver: user,
      status: FriendRequestStatus.Pending,
    });
    if (!request)
      throw new NotFoundException("Pending friend request not found");
    request.status = FriendRequestStatus.Rejected;
    return request.save();
  }

  async cancel(id: string, user: string) {
    const request = await FriendRequestModel.findOneAndDelete({
      _id: id,
      sender: user,
      status: FriendRequestStatus.Pending,
    });
    if (!request) throw new NotFoundException("Sent friend request not found");
    return { message: "Friend request cancelled" };
  }

  async remove(user: string, friend: string) {
    const request = await FriendRequestModel.findOneAndDelete({
      status: FriendRequestStatus.Accepted,
      $or: [
        { pairKey: this.pairKey(user, friend) },
        { sender: user, receiver: friend },
        { sender: friend, receiver: user },
      ],
    });
    if (!request) throw new NotFoundException("Friendship not found");
    return { message: "Friend removed" };
  }

  async status(user: string, other: string) {
    const request = await FriendRequestModel.findOne({
      $or: [
        { pairKey: this.pairKey(user, other) },
        { sender: user, receiver: other },
        { sender: other, receiver: user },
      ],
    });
    if (!request) return { status: "none" };
    if (request.status === FriendRequestStatus.Accepted)
      return { status: "accepted", requestId: request._id };
    if (request.status === FriendRequestStatus.Rejected)
      return { status: "rejected", requestId: request._id };
    return {
      status:
        request.sender.toString() === user
          ? "pending_sent"
          : "pending_received",
      requestId: request._id,
    };
  }

  async list(user: string, kind: "received" | "sent" | "friends") {
    const filter =
      kind === "received"
        ? { receiver: user, status: FriendRequestStatus.Pending }
        : kind === "sent"
          ? { sender: user, status: FriendRequestStatus.Pending }
          : {
              status: FriendRequestStatus.Accepted,
              $or: [{ sender: user }, { receiver: user }],
            };
    const rows = await FriendRequestModel.find(filter)
      .populate("sender receiver", "firstName lastName profilePic")
      .sort({ createdAt: -1 });

    if (kind !== "friends") return rows;

    return rows.map((row) => {
      const friend =
        row.sender._id?.toString?.() === user ? row.receiver : row.sender;
      return {
        requestId: row._id,
        friend,
        createdAt: row.createdAt,
      };
    });
  }
}

export default new FriendService();
