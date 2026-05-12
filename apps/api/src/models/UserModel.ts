import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    isPrivate: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isEmailVerified: { type: Boolean, default: true },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    tweetsCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    followerIds: { type: [String], default: [] },
    followingIds: { type: [String], default: [] },
    blockedUserIds: { type: [String], default: [] },
    mutedUserIds: { type: [String], default: [] },
    likedTweetIds: { type: [String], default: [] },
    bookmarkedTweetIds: { type: [String], default: [] },
    retweetedTweetIds: { type: [String], default: [] },
    passwordHash: { type: String, required: true },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export type UserDb = InferSchemaType<typeof userSchema>;

export const UserModel =
  mongoose.models.User || mongoose.model('User', userSchema);
