import { StoryModel } from '../models/StoryModel';
import { UserModel } from '../models/UserModel';
import { HttpError } from '../utils/httpError';
import { findUsersByIds, toStoryWithAuthor, type SerializedUserDoc } from '../utils/serializers';

export const storyService = {
  async getFeed(userId: string) {
    const viewer = (await UserModel.findById(userId).lean()) as SerializedUserDoc | null;
    if (!viewer) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const authorIds = [...new Set([userId, ...(viewer.followingIds ?? []), ...(viewer.followerIds ?? [])])];
    const stories = await StoryModel.find({
      authorId: { $in: authorIds },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: 1 })
      .lean();

    const authorsById = await findUsersByIds([...new Set(stories.map((story) => story.authorId))]);
    return stories
      .map((story) => {
        const author = authorsById.get(story.authorId);
        if (!author) return null;
        return toStoryWithAuthor(story, author, viewer);
      })
      .filter((story): story is NonNullable<typeof story> => Boolean(story));
  },

  async getUserStories(viewerId: string, targetUserId: string) {
    const [viewer, target] = (await Promise.all([UserModel.findById(viewerId).lean(), UserModel.findById(targetUserId).lean()])) as [SerializedUserDoc | null, SerializedUserDoc | null];
    if (!target) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const stories = await StoryModel.find({ authorId: targetUserId, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: 1 })
      .lean();

    return stories.map((story) => toStoryWithAuthor(story, target, viewer));
  },

  async createStory(userId: string, input: { caption?: string; background: string; media?: any }) {
    const author = (await UserModel.findById(userId).lean()) as SerializedUserDoc | null;
    if (!author) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const story = await StoryModel.create({
      authorId: userId,
      caption: input.caption,
      background: input.background,
      media: input.media,
      viewersCount: 0,
      seenBy: [],
      likedBy: [],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return toStoryWithAuthor(story.toObject(), author, author);
  },

  async markSeen(userId: string, storyId: string) {
    const story = await StoryModel.findById(storyId);
    if (!story) {
      throw new HttpError(404, 'STORY_NOT_FOUND', 'Story not found');
    }
    if (!story.seenBy.includes(userId)) {
      story.seenBy = [...story.seenBy, userId];
      story.viewersCount += 1;
      await story.save();
    }
    return story;
  },

  async toggleLike(userId: string, storyId: string) {
    const story = await StoryModel.findById(storyId);
    if (!story) {
      throw new HttpError(404, 'STORY_NOT_FOUND', 'Story not found');
    }

    const alreadyLiked = story.likedBy.includes(userId);
    story.likedBy = alreadyLiked
      ? story.likedBy.filter((id: string) => id !== userId)
      : [...story.likedBy, userId];
    await story.save();

    return {
      liked: !alreadyLiked,
      likedBy: story.likedBy,
    };
  },

  async deleteStory(userId: string, storyId: string) {
    await StoryModel.deleteOne({ _id: storyId, authorId: userId });
  },

  async reshareStory(userId: string, storyId: string) {
    const [sourceStory, author] = (await Promise.all([StoryModel.findById(storyId).lean(), UserModel.findById(userId).lean()])) as [any, SerializedUserDoc | null];
    if (!sourceStory || !author) {
      throw new HttpError(404, 'NOT_FOUND', 'Story or user not found');
    }

    const story = await StoryModel.create({
      authorId: userId,
      caption: sourceStory.caption,
      background: sourceStory.background,
      media: sourceStory.media,
      viewersCount: 0,
      seenBy: [],
      likedBy: [],
      resharedFromStoryId: String(sourceStory._id),
      resharedFromUserId: sourceStory.authorId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return toStoryWithAuthor(story.toObject(), author, author);
  },
};