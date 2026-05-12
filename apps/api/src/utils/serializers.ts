import type {
  NotificationWithActor,
  StoryWithAuthor,
  TweetWithAuthor,
  User,
  UserProfile,
} from '@social-media/shared-types';
import { UserModel } from '../models/UserModel';

type UserDocLike = {
  _id: unknown;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  location?: string;
  website?: string;
  birthDate?: Date;
  isPrivate: boolean;
  isVerified: boolean;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
  likesCount: number;
  followerIds?: string[];
  followingIds?: string[];
  blockedUserIds?: string[];
  mutedUserIds?: string[];
  likedTweetIds?: string[];
  bookmarkedTweetIds?: string[];
  retweetedTweetIds?: string[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type SerializedUserDoc = UserDocLike;

export function toPublicUser(doc: UserDocLike): User {
  return {
    id: String(doc._id),
    username: doc.username,
    email: doc.email,
    displayName: doc.displayName,
    bio: doc.bio,
    avatar: doc.avatar,
    coverImage: doc.coverImage,
    location: doc.location,
    website: doc.website,
    birthDate: doc.birthDate ? new Date(doc.birthDate) : undefined,
    isPrivate: doc.isPrivate,
    isVerified: doc.isVerified,
    role: doc.role,
    isEmailVerified: doc.isEmailVerified,
    followersCount: doc.followersCount,
    followingCount: doc.followingCount,
    tweetsCount: doc.tweetsCount,
    likesCount: doc.likesCount,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
    lastLoginAt: doc.lastLoginAt ? new Date(doc.lastLoginAt) : undefined,
  };
}

export function toUserProfile(doc: UserDocLike, viewer?: UserDocLike | null): UserProfile {
  const id = String(doc._id);
  return {
    id,
    username: doc.username,
    displayName: doc.displayName,
    bio: doc.bio,
    avatar: doc.avatar,
    coverImage: doc.coverImage,
    location: doc.location,
    website: doc.website,
    birthDate: doc.birthDate ? new Date(doc.birthDate) : undefined,
    isPrivate: doc.isPrivate,
    isVerified: doc.isVerified,
    role: doc.role,
    followersCount: doc.followersCount,
    followingCount: doc.followingCount,
    tweetsCount: doc.tweetsCount,
    likesCount: doc.likesCount,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
    lastLoginAt: doc.lastLoginAt ? new Date(doc.lastLoginAt) : undefined,
    isFollowing: Boolean(viewer?.followingIds?.includes(id)),
    isFollowedBy: Boolean(viewer?.followerIds?.includes(id)),
    isBlocked: Boolean(viewer?.blockedUserIds?.includes(id)),
    isMuted: Boolean(viewer?.mutedUserIds?.includes(id)),
  };
}

export async function findUsersByIds(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, UserDocLike>();
  }

  const users = (await UserModel.find({ _id: { $in: userIds } }).lean()) as unknown as UserDocLike[];
  return new Map(users.map((user) => [String(user._id), user]));
}

export function orderProfilesByIds(
  userIds: string[],
  usersById: Map<string, UserDocLike>,
  viewer?: UserDocLike | null
) {
  return userIds
    .map((id) => usersById.get(id))
    .filter((user): user is UserDocLike => Boolean(user))
    .map((user) => toUserProfile(user, viewer));
}

export function toTweetWithAuthor(
  tweet: any,
  author: UserDocLike,
  viewer?: UserDocLike | null
): TweetWithAuthor {
  return {
    id: String(tweet._id),
    authorId: tweet.authorId,
    content: tweet.content,
    media: tweet.media,
    poll: tweet.poll,
    likesCount: tweet.likesCount,
    repliesCount: tweet.repliesCount,
    retweetsCount: tweet.retweetsCount,
    bookmarksCount: tweet.bookmarksCount,
    isReply: tweet.isReply,
    replyTo: tweet.replyTo,
    isRetweet: tweet.isRetweet,
    retweetOf: tweet.retweetOf,
    inReplyToUserId: tweet.inReplyToUserId,
    mentions: tweet.mentions ?? [],
    hashtags: tweet.hashtags ?? [],
    isLocked: tweet.isLocked,
    isEdited: tweet.isEdited,
    editedAt: tweet.editedAt ? new Date(tweet.editedAt) : undefined,
    createdAt: new Date(tweet.createdAt),
    updatedAt: new Date(tweet.updatedAt),
    author: toUserProfile(author, viewer),
  };
}

export function toStoryWithAuthor(
  story: any,
  author: UserDocLike,
  viewer?: UserDocLike | null
): StoryWithAuthor {
  return {
    id: String(story._id),
    authorId: story.authorId,
    caption: story.caption,
    background: story.background,
    media: story.media,
    viewersCount: story.viewersCount,
    seenBy: story.seenBy ?? [],
    likedBy: story.likedBy ?? [],
    resharedFromStoryId: story.resharedFromStoryId,
    resharedFromUserId: story.resharedFromUserId,
    createdAt: new Date(story.createdAt),
    expiresAt: new Date(story.expiresAt),
    author: toUserProfile(author, viewer),
  };
}

export function toNotificationWithActor(
  notification: any,
  actor: UserDocLike,
  viewer?: UserDocLike | null
): NotificationWithActor {
  return {
    id: String(notification._id),
    userId: notification.userId,
    actorId: notification.actorId,
    type: notification.type,
    targetId: notification.targetId,
    isRead: notification.isRead,
    createdAt: new Date(notification.createdAt),
    actor: toUserProfile(actor, viewer),
  };
}