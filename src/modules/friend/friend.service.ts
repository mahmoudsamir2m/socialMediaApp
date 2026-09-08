import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "../../common/exceptions/applications.exceptions";
import {
  FriendRequestModel,
  FriendRequestStatus,
} from "../../database/model/friend-request.model";
import UserModel from "../../database/model/user.model";
class FriendService {
  async send(sender: string, receiver: string) {
    if (sender === receiver)
      throw new ForbiddenException("You cannot add yourself");
    if (!(await UserModel.exists({ _id: receiver })))
      throw new NotFoundException("User not found");
    const current = await FriendRequestModel.findOne({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    });
    if (current?.status === FriendRequestStatus.Accepted)
      throw new ConflictException("Users are already friends");
    if (current?.status === FriendRequestStatus.Pending)
      throw new ConflictException("A friend request already exists");
    return FriendRequestModel.findOneAndUpdate(
      { sender, receiver },
      { status: FriendRequestStatus.Pending },
      { new: true, upsert: true },
    );
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
    return request.save();
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
        { sender: user, receiver: other },
        { sender: other, receiver: user },
      ],
    });
    if (!request) return { status: "none" };
    if (request.status === FriendRequestStatus.Accepted)
      return { status: "accepted" };
    if (request.status === FriendRequestStatus.Rejected)
      return { status: "rejected" };
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
    return FriendRequestModel.find(filter)
      .populate("sender receiver", "firstName lastName profilePic")
      .sort({ createdAt: -1 });
  }
}
export default new FriendService();
