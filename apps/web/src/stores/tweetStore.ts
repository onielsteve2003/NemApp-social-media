import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { TweetWithAuthor } from '@shared-types';
import { getMockFeedPage, FEED_PAGE_SIZE, MOCK_TWEETS } from '@/mocks/tweets';
import { MOCK_USERS } from '@/mocks/auth';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

interface TweetState {
  feed: TweetWithAuthor[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  page: number;
  likedIds: Set<string>;
  retweetedIds: Set<string>;
  bookmarkedIds: Set<string>;

  // Actions
  fetchFeed: () => Promise<void>;
  fetchMore: () => Promise<void>;
  createTweet: (content: string, authorId: string) => void;
  createReply: (
    tweetId: string,
    content: string,
    authorId: string,
    replyToId?: string
  ) => void;
  toggleLike: (tweetId: string) => void;
  toggleRetweet: (tweetId: string) => void;
  toggleBookmark: (tweetId: string) => void;
}

// Sets are not serializable so we keep them outside the store as module-level state
// and re-expose them via the store interface (no persist needed for interaction state)
const likedIds = new Set<string>();
const retweetedIds = new Set<string>();
const bookmarkedIds = new Set<string>();

let tweetIdCounter = MOCK_TWEETS.length + 1;

const GENERATED_POSTS = [
  'Quietly shipping beats loudly planning. Small steps every day compound faster than motivation.',
  'If your UI feels "off", check spacing rhythm before changing colors. Structure first, decoration second.',
  'Most bugs are communication bugs: unclear assumptions between components, teams, or layers.',
  'A productive day is often one hard decision plus many tiny boring ones done consistently.',
  'Docs are part of the product. If users need a tutorial to do a basic task, the UX needs another pass.',
  'Performance is a feature. People do not notice what loads fast, but they always notice what feels slow.',
  'A clean codebase is less about perfection and more about making future changes feel safe.',
  'Design systems are not creativity killers. They remove repetitive choices so you can focus on meaningful ones.',
];

function toAuthorProfile(user: (typeof MOCK_USERS)[number]) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatar: user.avatar,
    coverImage: user.coverImage,
    location: user.location,
    website: user.website,
    isPrivate: user.isPrivate,
    isVerified: user.isVerified,
    role: user.role,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    tweetsCount: user.tweetsCount,
    likesCount: user.likesCount,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function generateMockPage(page: number, size: number): TweetWithAuthor[] {
  const now = Date.now();
  return Array.from({ length: size }).map((_, index) => {
    const user = MOCK_USERS[(page + index) % MOCK_USERS.length];
    const content = GENERATED_POSTS[(page * size + index) % GENERATED_POSTS.length];
    const createdAt = new Date(now - (page * size + index + 1) * 1000 * 60 * 37);
    return {
      id: `tweet-generated-${page}-${index}-${tweetIdCounter++}`,
      authorId: user.id,
      content,
      likesCount: 12 + ((page + index) % 240),
      repliesCount: 2 + ((page + index) % 48),
      retweetsCount: 1 + ((page + index) % 77),
      bookmarksCount: 1 + ((page + index) % 53),
      mentions: [],
      hashtags: [],
      createdAt,
      updatedAt: createdAt,
      author: toAuthorProfile(user),
    };
  });
}

export const useTweetStore = create<TweetState>()(
  devtools(
    (set, get) => ({
      feed: [],
      isLoading: false,
      isFetchingMore: false,
      hasMore: true,
      page: 0,
      likedIds,
      retweetedIds,
      bookmarkedIds,

      fetchFeed: async () => {
        set({ isLoading: true });
        // Simulate network latency
        await new Promise((r) => setTimeout(r, 600));
        const tweets = getMockFeedPage(0);
        set({
          feed: tweets,
          page: 1,
          hasMore: true,
          isLoading: false,
        });
      },

      fetchMore: async () => {
        const { page, isFetchingMore, hasMore } = get();
        if (isFetchingMore || !hasMore) return;
        set({ isFetchingMore: true });
        await new Promise((r) => setTimeout(r, 500));
        const seededTweets = getMockFeedPage(page);
        const tweets =
          seededTweets.length > 0
            ? seededTweets
            : generateMockPage(page, FEED_PAGE_SIZE);
        set((s) => ({
          feed: [...s.feed, ...tweets],
          page: s.page + 1,
          hasMore: true,
          isFetchingMore: false,
        }));
      },

      createTweet: (content, authorId) => {
        // Resolve author either from the current feed or user mocks.
        const authorTweet = get().feed.find((t) => t.authorId === authorId);
        const fallbackAuthor = MOCK_USERS.find((u) => u.id === authorId);
        const author = authorTweet?.author ?? (fallbackAuthor ? toAuthorProfile(fallbackAuthor) : null);
        if (!author) return;
        const newTweet: TweetWithAuthor = {
          id: `tweet-new-${tweetIdCounter++}`,
          authorId,
          content,
          likesCount: 0,
          repliesCount: 0,
          retweetsCount: 0,
          bookmarksCount: 0,
          mentions: [],
          hashtags: content.match(/#(\w+)/g)?.map((h) => h.slice(1)) ?? [],
          createdAt: new Date(),
          updatedAt: new Date(),
          author,
        };
        set((s) => ({ feed: [newTweet, ...s.feed] }));
      },

      createReply: (tweetId, content, authorId, replyToId) => {
        const authorTweet = get().feed.find((t) => t.authorId === authorId);
        const fallbackAuthor = MOCK_USERS.find((u) => u.id === authorId);
        const author = authorTweet?.author ?? (fallbackAuthor ? toAuthorProfile(fallbackAuthor) : null);
        if (!author) return;

        const parentId = replyToId ?? tweetId;

        const reply: TweetWithAuthor = {
          id: `tweet-reply-${tweetIdCounter++}`,
          authorId,
          content,
          likesCount: 0,
          repliesCount: 0,
          retweetsCount: 0,
          bookmarksCount: 0,
          isReply: true,
          replyTo: parentId,
          mentions: [],
          hashtags: content.match(/#(\w+)/g)?.map((h) => h.slice(1)) ?? [],
          createdAt: new Date(),
          updatedAt: new Date(),
          author,
        };

        set((s) => ({
          feed: [reply, ...s.feed].map((t) =>
            t.id === parentId
              ? { ...t, repliesCount: t.repliesCount + 1 }
              : t
          ),
        }));

        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        const mentions = content.match(/@(\w+)/g) ?? [];
        for (const mention of mentions) {
          const username = mention.slice(1).toLowerCase();
          const mentionedUser = MOCK_USERS.find(
            (user) => user.username.toLowerCase() === username
          );
          if (!mentionedUser) continue;
          useNotificationStore
            .getState()
            .addNotification(currentUser.id, mentionedUser.id, 'mention', tweetId);
        }
      },

      toggleLike: (tweetId) => {
        const isLiked = likedIds.has(tweetId);
        if (isLiked) {
          likedIds.delete(tweetId);
        } else {
          likedIds.add(tweetId);
        }
        set((s) => ({
          likedIds: new Set(likedIds),
          feed: s.feed.map((t) =>
            t.id === tweetId
              ? { ...t, likesCount: t.likesCount + (isLiked ? -1 : 1) }
              : t
          ),
        }));
      },

      toggleRetweet: (tweetId) => {
        const isRetweeted = retweetedIds.has(tweetId);
        if (isRetweeted) {
          retweetedIds.delete(tweetId);
        } else {
          retweetedIds.add(tweetId);
        }
        set((s) => ({
          retweetedIds: new Set(retweetedIds),
          feed: s.feed.map((t) =>
            t.id === tweetId
              ? { ...t, retweetsCount: t.retweetsCount + (isRetweeted ? -1 : 1) }
              : t
          ),
        }));
      },

      toggleBookmark: (tweetId) => {
        const isBookmarked = bookmarkedIds.has(tweetId);
        if (isBookmarked) {
          bookmarkedIds.delete(tweetId);
        } else {
          bookmarkedIds.add(tweetId);
        }
        set((s) => ({
          bookmarkedIds: new Set(bookmarkedIds),
          feed: s.feed.map((t) =>
            t.id === tweetId
              ? { ...t, bookmarksCount: t.bookmarksCount + (isBookmarked ? -1 : 1) }
              : t
          ),
        }));
      },
    }),
    { name: 'tweet-store' }
  )
);
