import mongoose from 'mongoose';
import { UserModel } from '../models/UserModel.js';
import { HttpError } from '../utils/httpError.js';
import {
  findUsersByIds,
  orderProfilesByIds,
  toPublicUser,
  toUserProfile,
  type SerializedUserDoc,
} from '../utils/serializers.js';
import { notificationService } from './notificationService.js';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findUserByUsername(username: string) {
  return UserModel.findOne({
    username: { $regex: `^${escapeRegex(username)}$`, $options: 'i' },
  }).lean();
}

export const userService = {
  async getById(userId: string) {
    return UserModel.findById(userId).lean();
  },

  async getRelationships(userId: string) {
    const user = (await UserModel.findById(userId).lean()) as SerializedUserDoc | null;
    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    return {
      followingIds: user.followingIds ?? [],
      followerIds: user.followerIds ?? [],
    };
  },

  async discover(viewerId: string) {
    const viewer = (await UserModel.findById(viewerId).lean()) as SerializedUserDoc | null;
    const users = (await UserModel.find({ _id: { $ne: viewerId } }).sort({ followersCount: -1 }).limit(12).lean()) as unknown as SerializedUserDoc[];
    return users.map((user) => toUserProfile(user, viewer));
  },

  async search(viewerId: string, query: string) {
    const viewer = (await UserModel.findById(viewerId).lean()) as SerializedUserDoc | null;
    const search = query.trim();
    if (!search) {
      return [];
    }

    const users = (await UserModel.find({
      $or: [
        { username: { $regex: escapeRegex(search), $options: 'i' } },
        { displayName: { $regex: escapeRegex(search), $options: 'i' } },
        { bio: { $regex: escapeRegex(search), $options: 'i' } },
        { location: { $regex: escapeRegex(search), $options: 'i' } },
        { website: { $regex: escapeRegex(search), $options: 'i' } },
      ],
    })
      .sort({ followersCount: -1 })
      .limit(20)
      .lean()) as unknown as SerializedUserDoc[];

    return users.map((user) => toUserProfile(user, viewer));
  },

  async getProfileByUsername(viewerId: string, username: string) {
    const [viewer, target] = (await Promise.all([
      UserModel.findById(viewerId).lean(),
      findUserByUsername(username),
    ])) as [SerializedUserDoc | null, SerializedUserDoc | null];

    if (!target) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    return toUserProfile(target, viewer);
  },

  async getFollowers(viewerId: string, username: string) {
    const [viewer, target] = (await Promise.all([
      UserModel.findById(viewerId).lean(),
      findUserByUsername(username),
    ])) as [SerializedUserDoc | null, SerializedUserDoc | null];

    if (!target) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const usersById = await findUsersByIds(target.followerIds ?? []);
    return orderProfilesByIds(target.followerIds ?? [], usersById, viewer);
  },

  async getFollowing(viewerId: string, username: string) {
    const [viewer, target] = (await Promise.all([
      UserModel.findById(viewerId).lean(),
      findUserByUsername(username),
    ])) as [SerializedUserDoc | null, SerializedUserDoc | null];

    if (!target) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const usersById = await findUsersByIds(target.followingIds ?? []);
    return orderProfilesByIds(target.followingIds ?? [], usersById, viewer);
  },

  async toggleFollow(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new HttpError(400, 'INVALID_TARGET', 'You cannot follow yourself');
    }

    if (!mongoose.isValidObjectId(targetUserId)) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const [currentUser, targetUser] = await Promise.all([
      UserModel.findById(userId),
      UserModel.findById(targetUserId),
    ]);

    if (!currentUser || !targetUser) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const isFollowing = currentUser.followingIds.includes(targetUserId);

    if (isFollowing) {
      currentUser.followingIds = currentUser.followingIds.filter((id: string) => id !== targetUserId);
      targetUser.followerIds = targetUser.followerIds.filter((id: string) => id !== userId);
    } else {
      currentUser.followingIds = [...new Set([...currentUser.followingIds, targetUserId])];
      targetUser.followerIds = [...new Set([...targetUser.followerIds, userId])];
      await notificationService.create(targetUserId, userId, 'follow', userId);
    }

    currentUser.followingCount = currentUser.followingIds.length;
    targetUser.followersCount = targetUser.followerIds.length;

    await Promise.all([currentUser.save(), targetUser.save()]);

    return {
      followingIds: currentUser.followingIds,
      followerIds: currentUser.followerIds,
      targetProfile: toUserProfile(targetUser.toObject(), currentUser.toObject()),
    };
  },

  async updateMe(userId: string, input: Partial<Record<'displayName' | 'bio' | 'location' | 'website' | 'avatar' | 'coverImage', string>>) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    if (typeof input.displayName === 'string' && input.displayName.trim()) {
      user.displayName = input.displayName.trim();
    }
    if (typeof input.bio === 'string') user.bio = input.bio.trim();
    if (typeof input.location === 'string') user.location = input.location.trim();
    if (typeof input.website === 'string') user.website = input.website.trim();
    if (typeof input.avatar === 'string') user.avatar = input.avatar.trim();
    if (typeof input.coverImage === 'string') user.coverImage = input.coverImage.trim();

    await user.save();
    return toPublicUser(user.toObject());
  },
};