import { User } from '@shared-types';

// Mock users database
export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    username: 'demo',
    email: 'demo@example.com',
    displayName: 'Demo User',
    bio: 'This is a demo account',
    avatar:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    coverImage:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=200&fit=crop',
    location: 'Everywhere',
    website: 'https://example.com',
    isPrivate: false,
    isVerified: true,
    role: 'user',
    isEmailVerified: true,
    followersCount: 1250,
    followingCount: 342,
    tweetsCount: 156,
    likesCount: 892,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-05-11'),
  },
  {
    id: 'user-2',
    username: 'alice',
    email: 'alice@example.com',
    displayName: 'Alice Johnson',
    bio: 'Web developer & coffee enthusiast ☕️',
    avatar:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    location: 'San Francisco, CA',
    isPrivate: false,
    isVerified: false,
    role: 'user',
    isEmailVerified: true,
    followersCount: 3420,
    followingCount: 256,
    tweetsCount: 524,
    likesCount: 2150,
    createdAt: new Date('2023-06-10'),
    updatedAt: new Date('2024-05-11'),
  },
  {
    id: 'user-3',
    username: 'bob',
    email: 'bob@example.com',
    displayName: 'Bob Smith',
    bio: 'Designer, creator, dreamer',
    avatar:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    location: 'New York, NY',
    isPrivate: false,
    isVerified: false,
    role: 'user',
    isEmailVerified: true,
    followersCount: 892,
    followingCount: 412,
    tweetsCount: 234,
    likesCount: 1560,
    createdAt: new Date('2023-11-22'),
    updatedAt: new Date('2024-05-11'),
  },
];

// Credentials for demo login
export const DEMO_CREDENTIALS = {
  email: 'demo@example.com',
  password: 'Demo@1234',
  username: 'demo',
};

// Mock authentication service
export const mockAuthService = {
  async login(email: string, password: string): Promise<{
    user: User;
    token: string;
    refreshToken: string;
  }> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = MOCK_USERS.find((u) => u.email === email);
    if (!user) {
      throw new Error('User not found');
    }

    // Mock password validation
    if (password !== DEMO_CREDENTIALS.password) {
      throw new Error('Invalid password');
    }

    return {
      user,
      token: `mock-token-${user.id}`,
      refreshToken: `mock-refresh-token-${user.id}`,
    };
  },

  async register(
    username: string,
    email: string,
    _password: string,
    displayName: string
  ): Promise<{
    user: User;
    token: string;
    refreshToken: string;
  }> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Check if user already exists
    if (MOCK_USERS.some((u) => u.email === email)) {
      throw new Error('Email already registered');
    }

    if (MOCK_USERS.some((u) => u.username === username)) {
      throw new Error('Username already taken');
    }

    // Create new user
    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      email,
      displayName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      isPrivate: false,
      isVerified: false,
      role: 'user',
      isEmailVerified: false,
      followersCount: 0,
      followingCount: 0,
      tweetsCount: 0,
      likesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    MOCK_USERS.push(newUser);

    return {
      user: newUser,
      token: `mock-token-${newUser.id}`,
      refreshToken: `mock-refresh-token-${newUser.id}`,
    };
  },

  async logout(): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
  },
};
