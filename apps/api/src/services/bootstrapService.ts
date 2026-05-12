import bcrypt from 'bcryptjs';
import { ConversationModel } from '../models/ConversationModel';
import { NotificationModel } from '../models/NotificationModel';
import { StoryModel } from '../models/StoryModel';
import { TweetModel } from '../models/TweetModel';
import { UserModel } from '../models/UserModel';
import { DEMO_PASSWORD, MOCK_API_USERS } from '../data/mockUsers';

const SAMPLE_POSTS = [
  'Quietly shipping beats loudly planning.',
  'Design systems reduce repetitive choices so the important ideas can stand out.',
  'Performance is a feature. Fast feels trustworthy.',
  'A clean codebase makes bold changes safer.',
  'Stories should feel timely, not noisy.',
  'Today is for shipping the backend and cleaning the frontend contracts.',
];

const STORY_BACKGROUNDS = [
  'linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 100%)',
  'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
  'linear-gradient(135deg, #ec4899 0%, #7c3aed 100%)',
];

export async function ensureSeedData() {
  const existingUsers = await UserModel.find().lean();
  const byEmail = new Map(existingUsers.map((user) => [user.email.toLowerCase(), user]));
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const seedUser of MOCK_API_USERS) {
    if (byEmail.has(seedUser.email.toLowerCase())) {
      continue;
    }

    const created = await UserModel.create({
      username: seedUser.username.toLowerCase(),
      email: seedUser.email.toLowerCase(),
      displayName: seedUser.displayName,
      bio: seedUser.bio,
      avatar: seedUser.avatar,
      coverImage: seedUser.coverImage,
      location: seedUser.location,
      website: seedUser.website,
      isPrivate: seedUser.isPrivate,
      isVerified: seedUser.isVerified,
      role: seedUser.role,
      isEmailVerified: seedUser.isEmailVerified,
      followersCount: 0,
      followingCount: 0,
      tweetsCount: 0,
      likesCount: 0,
      followerIds: [],
      followingIds: [],
      blockedUserIds: [],
      mutedUserIds: [],
      likedTweetIds: [],
      bookmarkedTweetIds: [],
      retweetedTweetIds: [],
      passwordHash,
      lastLoginAt: seedUser.lastLoginAt,
      createdAt: seedUser.createdAt,
      updatedAt: seedUser.updatedAt,
    });
    byEmail.set(created.email.toLowerCase(), created.toObject());
  }

  const users = await UserModel.find().lean();
  const demo = users.find((user) => user.email === 'demo@example.com');
  const alice = users.find((user) => user.email === 'alice@example.com');
  const admin = users.find((user) => user.email === 'admin@nemapp.com');

  if (demo && alice && admin) {
    const demoDoc = await UserModel.findById(demo._id);
    const aliceDoc = await UserModel.findById(alice._id);
    const adminDoc = await UserModel.findById(admin._id);

    if (demoDoc && aliceDoc && adminDoc && demoDoc.followingIds.length === 0 && demoDoc.followerIds.length === 0) {
      demoDoc.followingIds = [String(aliceDoc._id), String(adminDoc._id)];
      demoDoc.followerIds = [String(aliceDoc._id), String(adminDoc._id)];
      demoDoc.followingCount = demoDoc.followingIds.length;
      demoDoc.followersCount = demoDoc.followerIds.length;

      aliceDoc.followingIds = [...new Set([...aliceDoc.followingIds, String(demoDoc._id)])];
      aliceDoc.followerIds = [...new Set([...aliceDoc.followerIds, String(demoDoc._id)])];
      aliceDoc.followingCount = aliceDoc.followingIds.length;
      aliceDoc.followersCount = aliceDoc.followerIds.length;

      adminDoc.followingIds = [...new Set([...adminDoc.followingIds, String(demoDoc._id)])];
      adminDoc.followerIds = [...new Set([...adminDoc.followerIds, String(demoDoc._id)])];
      adminDoc.followingCount = adminDoc.followingIds.length;
      adminDoc.followersCount = adminDoc.followerIds.length;

      await Promise.all([demoDoc.save(), aliceDoc.save(), adminDoc.save()]);
    }
  }

  if ((await TweetModel.countDocuments()) === 0) {
    const authors = users.filter((user) => user.email !== 'demo@example.com').slice(0, 5);
    for (let index = 0; index < authors.length; index += 1) {
      const author = authors[index];
      await TweetModel.create({
        authorId: String(author._id),
        content: SAMPLE_POSTS[index % SAMPLE_POSTS.length],
        likesCount: 8 + index * 3,
        repliesCount: 1 + index,
        retweetsCount: 2 + index,
        bookmarksCount: 1 + index,
        mentions: [],
        hashtags: ['nemapp', 'buildlog', 'social'],
        createdAt: new Date(Date.now() - (index + 1) * 1000 * 60 * 30),
        updatedAt: new Date(Date.now() - (index + 1) * 1000 * 60 * 30),
      });
      await UserModel.updateOne({ _id: author._id }, { $inc: { tweetsCount: 1 } });
    }
  }

  if ((await StoryModel.countDocuments()) === 0 && alice && admin) {
    const sourceUsers = [alice, admin];
    for (let index = 0; index < sourceUsers.length; index += 1) {
      const source = sourceUsers[index];
      await StoryModel.create({
        authorId: String(source._id),
        caption: index === 0 ? 'Shipping and testing the full-stack build.' : 'Watching the new APIs land cleanly.',
        background: STORY_BACKGROUNDS[index % STORY_BACKGROUNDS.length],
        viewersCount: 0,
        seenBy: [],
        likedBy: [],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - (index + 1) * 1000 * 60 * 15),
      });
    }
  }

  if ((await NotificationModel.countDocuments()) === 0 && demo && alice) {
    await NotificationModel.create({
      userId: String(demo._id),
      actorId: String(alice._id),
      type: 'follow',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 12),
    });
  }

  if ((await ConversationModel.countDocuments()) === 0 && demo && alice) {
    await ConversationModel.create({
      participantIds: [String(demo._id), String(alice._id)],
      participantKey: [String(demo._id), String(alice._id)].sort().join(':'),
      messages: [
        {
          id: `msg-seed-${Date.now()}`,
          senderId: String(alice._id),
          content: 'Hey! The backend looks live now.',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 20),
        },
      ],
      lastMessage: 'Hey! The backend looks live now.',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 20),
    });
  }
}