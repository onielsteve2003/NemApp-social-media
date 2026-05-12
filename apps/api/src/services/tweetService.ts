import { TweetModel } from '../models/TweetModel';
import { UserModel } from '../models/UserModel';
import { HttpError } from '../utils/httpError';
import { findUsersByIds, toTweetWithAuthor, type SerializedUserDoc } from '../utils/serializers';
import { notificationService } from './notificationService';

function extractHashtags(content: string) {
  return content.match(/#(\w+)/g)?.map((tag) => tag.slice(1)) ?? [];
}

function extractMentions(content: string) {
  return content.match(/@(\w+)/g)?.map((mention) => mention.slice(1).toLowerCase()) ?? [];
}

export const tweetService = {
  async getFeed(userId: string, page = 0, limit = 20, mode: 'for-you' | 'following' = 'for-you') {
    const viewer = (await UserModel.findById(userId).lean()) as SerializedUserDoc | null;
    if (!viewer) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const query: Record<string, unknown> = {};
    if (mode === 'following') {
      if ((viewer.followingIds ?? []).length === 0) {
        return {
          tweets: [],
          likedIds: viewer.likedTweetIds ?? [],
          retweetedIds: viewer.retweetedTweetIds ?? [],
          bookmarkedIds: viewer.bookmarkedTweetIds ?? [],
          hasMore: false,
        };
      }
      query.authorId = { $in: viewer.followingIds };
    }

    const tweets = await TweetModel.find(query)
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .lean();

    const authorsById = await findUsersByIds([...new Set(tweets.map((tweet) => tweet.authorId))]);

    return {
      tweets: tweets
        .map((tweet) => {
          const author = authorsById.get(tweet.authorId);
          if (!author) return null;
          return toTweetWithAuthor(tweet, author, viewer);
        })
        .filter((tweet): tweet is NonNullable<typeof tweet> => Boolean(tweet)),
      likedIds: viewer.likedTweetIds ?? [],
      retweetedIds: viewer.retweetedTweetIds ?? [],
      bookmarkedIds: viewer.bookmarkedTweetIds ?? [],
      hasMore: tweets.length === limit,
    };
  },

  async createTweet(userId: string, input: { content: string; media?: any[]; poll?: any }) {
    const author = await UserModel.findById(userId);
    if (!author) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const mentionUsers = await UserModel.find({ username: { $in: extractMentions(input.content) } }).lean();
    const tweet = await TweetModel.create({
      authorId: userId,
      content: input.content,
      media: input.media,
      poll: input.poll,
      likesCount: 0,
      repliesCount: 0,
      retweetsCount: 0,
      bookmarksCount: 0,
      mentions: mentionUsers.map((user) => String(user._id)),
      hashtags: extractHashtags(input.content),
    });

    author.tweetsCount += 1;
    await author.save();

    for (const mentionedUser of mentionUsers) {
      await notificationService.create(String(mentionedUser._id), userId, 'mention', String(tweet._id));
    }

    return toTweetWithAuthor(tweet.toObject(), author.toObject(), author.toObject());
  },

  async createReply(userId: string, tweetId: string, input: { content: string; media?: any[] }) {
    const [author, parentTweet] = await Promise.all([
      UserModel.findById(userId),
      TweetModel.findById(tweetId),
    ]);

    if (!author || !parentTweet) {
      throw new HttpError(404, 'NOT_FOUND', 'Tweet or user not found');
    }

    const mentionUsers = await UserModel.find({ username: { $in: extractMentions(input.content) } }).lean();

    const reply = await TweetModel.create({
      authorId: userId,
      content: input.content,
      media: input.media,
      likesCount: 0,
      repliesCount: 0,
      retweetsCount: 0,
      bookmarksCount: 0,
      isReply: true,
      replyTo: tweetId,
      inReplyToUserId: parentTweet.authorId,
      mentions: mentionUsers.map((user) => String(user._id)),
      hashtags: extractHashtags(input.content),
    });

    parentTweet.repliesCount += 1;
    author.tweetsCount += 1;
    await Promise.all([parentTweet.save(), author.save()]);

    if (parentTweet.authorId !== userId) {
      await notificationService.create(parentTweet.authorId, userId, 'reply', String(reply._id));
    }
    for (const mentionedUser of mentionUsers) {
      await notificationService.create(String(mentionedUser._id), userId, 'mention', String(reply._id));
    }

    return toTweetWithAuthor(reply.toObject(), author.toObject(), author.toObject());
  },

  async updateTweet(userId: string, tweetId: string, input: { content: string }) {
    const tweet = await TweetModel.findById(tweetId);
    if (!tweet) {
      throw new HttpError(404, 'TWEET_NOT_FOUND', 'Tweet not found');
    }
    if (tweet.authorId !== userId) {
      throw new HttpError(403, 'FORBIDDEN', 'You can only edit your own post');
    }

    tweet.content = input.content;
    tweet.isEdited = true;
    tweet.editedAt = new Date();
    await tweet.save();

    const author = (await UserModel.findById(userId).lean()) as SerializedUserDoc | null;
    if (!author) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    return toTweetWithAuthor(tweet.toObject(), author, author);
  },

  async deleteTweet(userId: string, tweetId: string) {
    const tweet = await TweetModel.findById(tweetId);
    if (!tweet) {
      throw new HttpError(404, 'TWEET_NOT_FOUND', 'Tweet not found');
    }
    if (tweet.authorId !== userId) {
      throw new HttpError(403, 'FORBIDDEN', 'You can only delete your own post');
    }

    const tweetIdsToRemove = [tweetId];
    if (!tweet.isReply) {
      const directReplies = await TweetModel.find({ replyTo: tweetId }).select('_id').lean();
      tweetIdsToRemove.push(...directReplies.map((item) => String(item._id)));
    }

    await TweetModel.deleteMany({ _id: { $in: tweetIdsToRemove } });
    await UserModel.updateOne({ _id: userId }, { $inc: { tweetsCount: tweet.isReply ? -1 : -1 } });

    return { ok: true };
  },

  async toggleLike(userId: string, tweetId: string) {
    const [user, tweet] = await Promise.all([UserModel.findById(userId), TweetModel.findById(tweetId)]);
    if (!user || !tweet) {
      throw new HttpError(404, 'NOT_FOUND', 'Tweet or user not found');
    }

    const alreadyLiked = user.likedTweetIds.includes(tweetId);
    if (alreadyLiked) {
      user.likedTweetIds = user.likedTweetIds.filter((id: string) => id !== tweetId);
      tweet.likedByIds = tweet.likedByIds.filter((id: string) => id !== userId);
      tweet.likesCount = Math.max(0, tweet.likesCount - 1);
      user.likesCount = Math.max(0, user.likesCount - 1);
    } else {
      user.likedTweetIds = [...new Set([...user.likedTweetIds, tweetId])];
      tweet.likedByIds = [...new Set([...tweet.likedByIds, userId])];
      tweet.likesCount += 1;
      user.likesCount += 1;
      if (tweet.authorId !== userId) {
        await notificationService.create(tweet.authorId, userId, 'like', tweetId);
      }
    }

    await Promise.all([user.save(), tweet.save()]);
    return {
      liked: !alreadyLiked,
      likesCount: tweet.likesCount,
      likedIds: user.likedTweetIds,
    };
  },

  async toggleRetweet(userId: string, tweetId: string) {
    const [user, tweet] = await Promise.all([UserModel.findById(userId), TweetModel.findById(tweetId)]);
    if (!user || !tweet) {
      throw new HttpError(404, 'NOT_FOUND', 'Tweet or user not found');
    }

    const alreadyRetweeted = user.retweetedTweetIds.includes(tweetId);
    if (alreadyRetweeted) {
      user.retweetedTweetIds = user.retweetedTweetIds.filter((id: string) => id !== tweetId);
      tweet.retweetedByIds = tweet.retweetedByIds.filter((id: string) => id !== userId);
      tweet.retweetsCount = Math.max(0, tweet.retweetsCount - 1);
    } else {
      user.retweetedTweetIds = [...new Set([...user.retweetedTweetIds, tweetId])];
      tweet.retweetedByIds = [...new Set([...tweet.retweetedByIds, userId])];
      tweet.retweetsCount += 1;
      if (tweet.authorId !== userId) {
        await notificationService.create(tweet.authorId, userId, 'retweet', tweetId);
      }
    }

    await Promise.all([user.save(), tweet.save()]);
    return {
      retweeted: !alreadyRetweeted,
      retweetsCount: tweet.retweetsCount,
      retweetedIds: user.retweetedTweetIds,
    };
  },

  async toggleBookmark(userId: string, tweetId: string) {
    const [user, tweet] = await Promise.all([UserModel.findById(userId), TweetModel.findById(tweetId)]);
    if (!user || !tweet) {
      throw new HttpError(404, 'NOT_FOUND', 'Tweet or user not found');
    }

    const alreadyBookmarked = user.bookmarkedTweetIds.includes(tweetId);
    if (alreadyBookmarked) {
      user.bookmarkedTweetIds = user.bookmarkedTweetIds.filter((id: string) => id !== tweetId);
      tweet.bookmarkedByIds = tweet.bookmarkedByIds.filter((id: string) => id !== userId);
      tweet.bookmarksCount = Math.max(0, tweet.bookmarksCount - 1);
    } else {
      user.bookmarkedTweetIds = [...new Set([...user.bookmarkedTweetIds, tweetId])];
      tweet.bookmarkedByIds = [...new Set([...tweet.bookmarkedByIds, userId])];
      tweet.bookmarksCount += 1;
    }

    await Promise.all([user.save(), tweet.save()]);
    return {
      bookmarked: !alreadyBookmarked,
      bookmarksCount: tweet.bookmarksCount,
      bookmarkedIds: user.bookmarkedTweetIds,
    };
  },

  async votePoll(userId: string, tweetId: string, optionId: string) {
    const tweet = await TweetModel.findById(tweetId);
    if (!tweet || !tweet.poll) {
      throw new HttpError(404, 'TWEET_NOT_FOUND', 'Tweet not found');
    }
    if (tweet.pollVoterIds.includes(userId)) {
      return tweet.poll;
    }

    tweet.poll.options = tweet.poll.options.map((option: any) =>
      option.id === optionId ? { ...option, votes: option.votes + 1 } : option
    );
    tweet.poll.totalVotes += 1;
    tweet.pollVoterIds = [...tweet.pollVoterIds, userId];
    await tweet.save();
    return tweet.poll;
  },
};