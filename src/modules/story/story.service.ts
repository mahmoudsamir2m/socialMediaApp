import {
  ForbiddenException,
  NotFoundException,
} from "../../common/exceptions/applications.exceptions";
import { imageService } from "../../common/services/image.service";
import { StoryModel, StoryViewModel } from "../../database/model/story.model";
import blockService from "../block/block.service";
import friendService from "../friend/friend.service";
import notificationService from "../notification/notification.service";
import { NotificationType } from "../../common/enums";

const STORY_TTL_MS = 24 * 60 * 60 * 1000;

class StoryService {
  async create(
    author: string,
    file: Express.Multer.File | undefined,
    caption?: string,
  ) {
    if (!file) {
      throw new ForbiddenException("Story image is required");
    }
    const uploaded = await imageService.uploadImages({
      userId: `stories/${author}`,
      files: [file],
    });
    const image = uploaded[0];
    if (!image) {
      throw new ForbiddenException("Failed to upload story image");
    }
    try {
      const story = await StoryModel.create({
        author,
        ...(caption ? { caption } : {}),
        image: {
          secureUrl: image.secureUrl,
          publicId: image.publicId,
          ...(image.width !== undefined ? { width: image.width } : {}),
          ...(image.height !== undefined ? { height: image.height } : {}),
        },
        expiresAt: new Date(Date.now() + STORY_TTL_MS),
      });
      const friends = await friendService.friendIds(author);
      await Promise.all(
        friends.map((friendId) =>
          notificationService.create({
            recipient: friendId,
            actor: author,
            type: NotificationType.Story,
            entityId: story._id.toString(),
            entityType: "story",
          }),
        ),
      );
      return story;
    } catch (error) {
      await imageService.deleteImages([image.publicId]);
      throw error;
    }
  }

  async feed(userId: string) {
    const friendIds = await friendService.friendIds(userId);
    const blocked = await blockService.ids(userId);
    const authorIds = [userId, ...friendIds].filter(
      (id) => !blocked.includes(id),
    );

    const stories = await StoryModel.find({
      author: { $in: authorIds },
      expiresAt: { $gt: new Date() },
    })
      .populate("author", "firstName lastName profilePic")
      .sort({ createdAt: -1 });

    const storyIds = stories.map((story) => story._id);
    const views = await StoryViewModel.find({
      story: { $in: storyIds },
      user: userId,
    }).lean();
    const viewed = new Set(views.map((view) => view.story.toString()));

    type StoryGroup = {
      author: unknown;
      stories: unknown[];
      hasUnseen: boolean;
    };

    const grouped = new Map<string, StoryGroup>();
    for (const story of stories) {
      const authorId =
        story.author._id?.toString?.() ?? story.author.toString();
      const item = {
        ...story.toObject(),
        viewedByMe: viewed.has(story._id.toString()),
      };
      const current = grouped.get(authorId) ?? {
        author: story.author,
        stories: [] as unknown[],
        hasUnseen: false,
      };
      current.stories.push(item);
      if (!item.viewedByMe) current.hasUnseen = true;
      grouped.set(authorId, current);
    }

    return { groups: [...grouped.values()] };
  }

  async getById(storyId: string, userId: string) {
    const story = await StoryModel.findOne({
      _id: storyId,
      expiresAt: { $gt: new Date() },
    }).populate("author", "firstName lastName profilePic");
    if (!story) throw new NotFoundException("Story not found");

    const authorId = story.author._id?.toString?.() ?? story.author.toString();
    if (authorId !== userId) {
      await blockService.assertNotBlocked(userId, authorId);
      if (!(await friendService.areFriends(userId, authorId))) {
        throw new ForbiddenException("Only friends can view this story");
      }
    }
    return story;
  }

  async view(storyId: string, userId: string) {
    const story = await this.getById(storyId, userId);
    await StoryViewModel.updateOne(
      { story: story._id, user: userId },
      { $setOnInsert: { story: story._id, user: userId } },
      { upsert: true },
    );
    return { message: "Story viewed" };
  }

  async viewers(storyId: string, userId: string) {
    const story = await StoryModel.findById(storyId);
    if (!story) throw new NotFoundException("Story not found");
    if (story.author.toString() !== userId) {
      throw new ForbiddenException("You cannot view these viewers");
    }
    return StoryViewModel.find({ story: storyId })
      .populate("user", "firstName lastName profilePic")
      .sort({ createdAt: -1 });
  }

  async delete(storyId: string, userId: string) {
    const story = await StoryModel.findById(storyId);
    if (!story) throw new NotFoundException("Story not found");
    if (story.author.toString() !== userId) {
      throw new ForbiddenException("You cannot delete this story");
    }
    await Promise.all([
      StoryViewModel.deleteMany({ story: storyId }),
      story.deleteOne(),
      imageService.deleteImages([story.image.publicId]),
    ]);
    return { message: "Story deleted" };
  }
}

export default new StoryService();