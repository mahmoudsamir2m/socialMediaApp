export enum GenderEnum {
  Male,
  Female,
}

export enum RoleEnum {
  Admin,
  User,
}

export enum ProviderEnum {
  System,
  Google,
}

export enum NotificationType {
  PostLike = "post_like",
  Comment = "comment",
  CommentLike = "comment_like",
  CommentReply = "comment_reply",
  Share = "share",
  FriendRequest = "friend_request",
  FriendAccept = "friend_accept",
  Message = "message",
  Story = "story",
}

export enum ReportTargetType {
  User = "user",
  Post = "post",
  Comment = "comment",
  Story = "story",
  Message = "message",
}

export enum ReportStatus {
  Pending = "pending",
  Reviewed = "reviewed",
  Dismissed = "dismissed",
}
