// ============================================
// USER TYPES
// ============================================
export interface User {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface UserProfile extends Omit<User, 'email' | 'isEmailVerified'> {
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isBlocked?: boolean;
  isMuted?: boolean;
}

// ============================================
// TWEET TYPES
// ============================================
export interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'gif';
  alt?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  options: PollOption[];
  totalVotes: number;
  expiresAt: Date;
}

export interface Tweet {
  id: string;
  authorId: string;
  content: string;
  media?: MediaItem[];
  poll?: Poll;
  likesCount: number;
  repliesCount: number;
  retweetsCount: number;
  bookmarksCount: number;
  isReply?: boolean;
  replyTo?: string;
  isRetweet?: boolean;
  retweetOf?: string;
  inReplyToUserId?: string;
  mentions: string[];
  hashtags: string[];
  isLocked?: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TweetWithAuthor extends Tweet {
  author: UserProfile;
}

// ============================================
// COMMENT TYPES
// ============================================
export interface Comment {
  id: string;
  authorId: string;
  tweetId: string;
  content: string;
  media?: MediaItem[];
  likesCount: number;
  repliesCount: number;
  isReply?: boolean;
  replyTo?: string;
  mentions: string[];
  hashtags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentWithAuthor extends Comment {
  author: UserProfile;
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export type NotificationType =
  | 'like'
  | 'follow'
  | 'reply'
  | 'mention'
  | 'retweet'
  | 'message';

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  type: NotificationType;
  targetId?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationWithActor extends Notification {
  actor: UserProfile;
}

// ============================================
// MESSAGE TYPES
// ============================================
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  media?: MediaItem[];
  isRead: boolean;
  readAt?: Date;
  editedAt?: Date;
  deletedAt?: Date;
  deletedForIds?: string[];
  deletedForEveryoneAt?: Date;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// STORY TYPES
// ============================================
export interface Story {
  id: string;
  authorId: string;
  caption?: string;
  background: string;
  media?: MediaItem;
  viewersCount: number;
  seenBy: string[];
  likedBy: string[];
  resharedFromStoryId?: string;
  resharedFromUserId?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface StoryWithAuthor extends Story {
  author: UserProfile;
}

// ============================================
// BOOKMARK TYPES
// ============================================
export interface Bookmark {
  id: string;
  userId: string;
  tweetId: string;
  createdAt: Date;
}

// ============================================
// TREND TYPES
// ============================================
export interface Trend {
  id: string;
  hashtag: string;
  country?: string;
  category?: string;
  tweetsCount: number;
  engagementScore: number;
  isFeatured?: boolean;
  isSuppressed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// REPORT TYPES
// ============================================
export type ReportReason =
  | 'spam'
  | 'abuse'
  | 'harassment'
  | 'violence'
  | 'other';

export type ReportStatus =
  | 'pending'
  | 'under_review'
  | 'resolved'
  | 'dismissed';

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedTweetId?: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// ============================================
// AUTH REQUEST/RESPONSE TYPES
// ============================================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// ============================================
// ERROR TYPES
// ============================================
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}
