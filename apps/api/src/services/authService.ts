import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import type { User } from '@social-media/shared-types';
import { env } from '../config/env';
import { HttpError } from '../utils/httpError';
import { findMockDemoRecordByEmail } from '../data/mockUsers';
import { UserModel } from '../models/UserModel';

interface TokenPayload {
  userId: string;
  email: string;
  username: string;
}

interface RegisterInput {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

function issueTokens(user: User) {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
  };
  const expiresIn = env.jwtExpire as jwt.SignOptions['expiresIn'];
  const refreshExpiresIn = env.refreshTokenExpire as jwt.SignOptions['expiresIn'];

  const accessToken = jwt.sign(payload, env.jwtSecret, {
    expiresIn,
  });

  const refreshToken = jwt.sign(payload, env.refreshTokenSecret, {
    expiresIn: refreshExpiresIn,
  });

  return { accessToken, refreshToken };
}

function createUserFromRegister(input: RegisterInput): User {
  const now = new Date();
  const normalizedUsername = input.username.trim().toLowerCase();
  const normalizedEmail = input.email.trim().toLowerCase();
  return {
    id: `user-${Date.now()}`,
    username: normalizedUsername,
    email: normalizedEmail,
    displayName: input.displayName,
    bio: 'Built with NemApp.',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedUsername}`,
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=200&fit=crop',
    location: 'Everywhere',
    website: 'https://example.com',
    birthDate: undefined,
    isPrivate: false,
    isVerified: false,
    role: 'user',
    isEmailVerified: true,
    followersCount: 0,
    followingCount: 0,
    tweetsCount: 0,
    likesCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function toPublicUser(doc: any): User {
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
    birthDate: undefined,
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
  };
}

export const authService = {
  async register(input: RegisterInput) {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      console.log('⚠️  MongoDB unavailable, using mock registration');
      const payload = createUserFromRegister(input);
      const tokens = issueTokens(payload);
      return {
        user: payload,
        ...tokens,
      };
    }

    const existingByEmail = await UserModel.findOne({ email: input.email.toLowerCase() }).lean();
    if (existingByEmail) {
      throw new HttpError(409, 'EMAIL_ALREADY_REGISTERED', 'Email already registered');
    }

    const existingByUsername = await UserModel.findOne({ username: input.username.toLowerCase() }).lean();
    if (existingByUsername) {
      throw new HttpError(409, 'USERNAME_ALREADY_TAKEN', 'Username already taken');
    }

    const payload = createUserFromRegister(input);
    const passwordHash = await bcrypt.hash(input.password, 10);

    const created = await UserModel.create({
      username: payload.username,
      email: payload.email.toLowerCase(),
      displayName: payload.displayName,
      bio: payload.bio,
      avatar: payload.avatar,
      coverImage: payload.coverImage,
      location: payload.location,
      website: payload.website,
      isPrivate: payload.isPrivate,
      isVerified: payload.isVerified,
      role: payload.role,
      isEmailVerified: payload.isEmailVerified,
      followersCount: payload.followersCount,
      followingCount: payload.followingCount,
      tweetsCount: payload.tweetsCount,
      likesCount: payload.likesCount,
      passwordHash,
    });

    const user = toPublicUser(created);

    const tokens = issueTokens(user);
    return {
      user,
      ...tokens,
    };
  },

  async login(email: string, password: string) {
    const isDbConnected = mongoose.connection.readyState === 1;
    let dbUser = null;

    if (isDbConnected) {
      dbUser = await UserModel.findOne({ email: email.toLowerCase() });
    }

    if (!dbUser) {
      const demo = findMockDemoRecordByEmail(email);
      if (demo) {
        if (isDbConnected) {
          const passwordHash = await bcrypt.hash(demo.password, 10);
          dbUser = await UserModel.create({
            username: demo.user.username,
            email: demo.user.email.toLowerCase(),
            displayName: demo.user.displayName,
            bio: demo.user.bio ?? '',
            avatar: demo.user.avatar ?? '',
            coverImage: demo.user.coverImage ?? '',
            location: demo.user.location ?? '',
            website: demo.user.website ?? '',
            isPrivate: demo.user.isPrivate,
            isVerified: demo.user.isVerified,
            role: demo.user.role,
            isEmailVerified: demo.user.isEmailVerified,
            followersCount: demo.user.followersCount,
            followingCount: demo.user.followingCount,
            tweetsCount: demo.user.tweetsCount,
            likesCount: demo.user.likesCount,
            passwordHash,
          });
        } else {
          // MongoDB down, use mock demo in-memory
          console.log('⚠️  MongoDB unavailable, using mock demo login');
          const user = demo.user;
          return {
            user,
            ...issueTokens(user),
          };
        }
      }
    }

    if (!dbUser) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const matches = await bcrypt.compare(password, dbUser.passwordHash);
    if (!matches) {
      throw new HttpError(401, 'INVALID_PASSWORD', 'Invalid password');
    }

    const user = toPublicUser(dbUser);
    return {
      user,
      ...issueTokens(user),
    };
  },

  async me(userId: string) {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      return null;
    }

    const user = await UserModel.findById(userId).lean();
    if (!user) {
      return null;
    }
    return toPublicUser(user);
  },

  logout() {
    return { ok: true };
  },

  verifyAccessToken(token: string) {
    const decoded = jwt.verify(token, env.jwtSecret) as TokenPayload;
    return decoded;
  },
};
