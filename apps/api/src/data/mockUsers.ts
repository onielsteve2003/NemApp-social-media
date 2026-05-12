import type { User } from '@social-media/shared-types';

export interface DemoCredentials {
  email: string;
  password: string;
}

export interface DemoUserRecord {
  user: User;
  password: string;
}

const now = new Date();

function makeUser(overrides: Partial<User> & Pick<User, 'id' | 'username' | 'email' | 'displayName'>): User {
  return {
    bio: 'This is a demo account',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${overrides.username}`,
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
    ...overrides,
  };
}

export const DEMO_PASSWORD = 'Demo@1234';

export const MOCK_DEMO_USERS: DemoUserRecord[] = [
  {
    user: makeUser({
      id: 'user-1',
      username: 'demo',
      email: 'demo@example.com',
      displayName: 'Demo User',
      bio: 'This is a demo account',
      isVerified: true,
      followersCount: 1250,
      followingCount: 342,
      tweetsCount: 156,
      likesCount: 892,
    }),
    password: DEMO_PASSWORD,
  },
  {
    user: makeUser({
      id: 'user-4',
      username: 'admin',
      email: 'admin@nemapp.com',
      displayName: 'NemApp Admin',
      bio: 'Platform administrator',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=admin',
      location: 'HQ',
      isVerified: true,
      role: 'admin',
      followersCount: 120,
      followingCount: 12,
      tweetsCount: 18,
      likesCount: 85,
    }),
    password: DEMO_PASSWORD,
  },
];

export const MOCK_API_USERS: User[] = [
  ...MOCK_DEMO_USERS.map((record) => record.user),
  makeUser({
    id: 'user-2',
    username: 'alice',
    email: 'alice@example.com',
    displayName: 'Alice Johnson',
    bio: 'Web developer & coffee enthusiast ☕️',
    location: 'San Francisco, CA',
    followersCount: 3420,
    followingCount: 256,
    tweetsCount: 524,
    likesCount: 2150,
    createdAt: new Date('2023-06-10'),
  }),
  makeUser({
    id: 'user-3',
    username: 'bob',
    email: 'bob@example.com',
    displayName: 'Bob Smith',
    bio: 'Designer, creator, dreamer',
    location: 'New York, NY',
    followersCount: 892,
    followingCount: 412,
    tweetsCount: 234,
    likesCount: 1560,
    createdAt: new Date('2023-11-22'),
  }),
  makeUser({
    id: 'user-5',
    username: 'vercel',
    email: 'vercel@example.com',
    displayName: 'Vercel',
    bio: 'The Frontend Cloud. Develop. Preview. Ship.',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=vercel',
    location: 'San Francisco, CA',
    website: 'https://vercel.com',
    isVerified: true,
    followersCount: 125000,
    followingCount: 145,
    tweetsCount: 3240,
    likesCount: 8920,
    createdAt: new Date('2022-01-10'),
  }),
  makeUser({
    id: 'user-6',
    username: 'leeerob',
    email: 'leeerob@example.com',
    displayName: 'Lee Robinson',
    bio: 'Building at @vercel. @nextjs core team.',
    location: 'San Francisco, CA',
    website: 'https://leerob.io',
    followersCount: 45000,
    followingCount: 234,
    tweetsCount: 1820,
    likesCount: 5320,
    createdAt: new Date('2021-03-15'),
  }),
  makeUser({
    id: 'user-7',
    username: 'shadcn',
    email: 'shadcn@example.com',
    displayName: 'shadcn',
    bio: 'Building beautiful UI components.',
    location: 'Canada',
    website: 'https://ui.shadcn.com',
    followersCount: 78000,
    followingCount: 567,
    tweetsCount: 2340,
    likesCount: 9200,
    createdAt: new Date('2021-06-22'),
  }),
];

export function findMockDemoRecordByEmail(email: string) {
  return MOCK_DEMO_USERS.find((entry) => entry.user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function findMockDemoRecordByUsername(username: string) {
  return MOCK_DEMO_USERS.find((entry) => entry.user.username.toLowerCase() === username.toLowerCase()) ?? null;
}

export function findMockUserByEmail(email: string) {
  return MOCK_API_USERS.find((entry) => entry.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function findMockUserByUsername(username: string) {
  return MOCK_API_USERS.find((entry) => entry.username.toLowerCase() === username.toLowerCase()) ?? null;
}
