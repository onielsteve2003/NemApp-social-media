import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { MediaItem, Poll, TweetWithAuthor } from '@shared-types';
import { apiClient } from '@/lib/apiClient';

const FEED_PAGE_SIZE = 20;

interface FeedResponse {
  success: boolean;
  data: {
    tweets: TweetWithAuthor[];
    likedIds: string[];
    retweetedIds: string[];
    bookmarkedIds: string[];
    hasMore: boolean;
  };
}

interface TweetMutationResponse {
  success: boolean;
  data: {
    tweet?: TweetWithAuthor;
    likesCount?: number;
    likedIds?: string[];
    retweetsCount?: number;
    retweetedIds?: string[];
    bookmarksCount?: number;
    bookmarkedIds?: string[];
    poll?: Poll;
  };
}

interface TweetState {
  feed: TweetWithAuthor[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  page: number;
  likedIds: Set<string>;
  retweetedIds: Set<string>;
  bookmarkedIds: Set<string>;
  fetchFeed: () => Promise<void>;
  fetchMore: () => Promise<void>;
  createTweet: (content: string, authorId: string, media?: MediaItem[], poll?: Poll) => Promise<void>;
  editTweet: (tweetId: string, content: string) => Promise<TweetWithAuthor | null>;
  deleteTweet: (tweetId: string) => Promise<void>;
  createReply: (
    tweetId: string,
    content: string,
    authorId: string,
    replyToId?: string,
    media?: MediaItem[]
  ) => Promise<void>;
  toggleLike: (tweetId: string) => Promise<void>;
  toggleRetweet: (tweetId: string) => Promise<void>;
  toggleBookmark: (tweetId: string) => Promise<void>;
  votePollOption: (tweetId: string, optionId: string) => Promise<void>;
}

function updateSet(values?: string[]) {
  return new Set(values ?? []);
}

export const useTweetStore = create<TweetState>()(
  devtools(
    (set, get) => ({
      feed: [],
      isLoading: false,
      isFetchingMore: false,
      hasMore: true,
      page: 0,
      likedIds: new Set<string>(),
      retweetedIds: new Set<string>(),
      bookmarkedIds: new Set<string>(),

      fetchFeed: async () => {
        set({ isLoading: true });
        const response = await apiClient.get<FeedResponse>(`/api/tweets/feed?page=0&limit=${FEED_PAGE_SIZE}`);
        set({
          feed: response.data.tweets ?? [],
          page: 1,
          hasMore: response.data.hasMore ?? false,
          likedIds: updateSet(response.data.likedIds),
          retweetedIds: updateSet(response.data.retweetedIds),
          bookmarkedIds: updateSet(response.data.bookmarkedIds),
          isLoading: false,
        });
      },

      fetchMore: async () => {
        const { page, isFetchingMore, hasMore } = get();
        if (isFetchingMore || !hasMore) return;

        set({ isFetchingMore: true });
        const response = await apiClient.get<FeedResponse>(`/api/tweets/feed?page=${page}&limit=${FEED_PAGE_SIZE}`);
        set((state) => ({
          feed: [...state.feed, ...(response.data.tweets ?? [])],
          page: state.page + 1,
          hasMore: response.data.hasMore ?? false,
          likedIds: updateSet(response.data.likedIds),
          retweetedIds: updateSet(response.data.retweetedIds),
          bookmarkedIds: updateSet(response.data.bookmarkedIds),
          isFetchingMore: false,
        }));
      },

      createTweet: async (content, _authorId, media, poll) => {
        const response = await apiClient.post<TweetMutationResponse>('/api/tweets', {
          content,
          media,
          poll,
        });
        if (!response.data.tweet) return;

        set((state) => ({
          feed: [response.data.tweet!, ...state.feed],
        }));
      },

      editTweet: async (tweetId, content) => {
        const response = await apiClient.patch<TweetMutationResponse>(`/api/tweets/${tweetId}`, {
          content,
        });
        if (!response.data.tweet) return null;

        set((state) => ({
          feed: state.feed.map((tweet) =>
            tweet.id === tweetId ? response.data.tweet! : tweet
          ),
        }));

        return response.data.tweet;
      },

      deleteTweet: async (tweetId) => {
        await apiClient.delete(`/api/tweets/${tweetId}`);
        set((state) => ({
          feed: state.feed.filter((tweet) => tweet.id !== tweetId && tweet.replyTo !== tweetId),
        }));
      },

      createReply: async (tweetId, content, _authorId, replyToId, media) => {
        const parentId = replyToId ?? tweetId;
        const response = await apiClient.post<TweetMutationResponse>(`/api/tweets/${tweetId}/replies`, {
          content,
          media,
        });
        if (!response.data.tweet) return;

        set((state) => ({
          feed: [response.data.tweet!, ...state.feed].map((tweet) =>
            tweet.id === parentId
              ? { ...tweet, repliesCount: tweet.repliesCount + 1 }
              : tweet
          ),
        }));
      },

      toggleLike: async (tweetId) => {
        const response = await apiClient.post<TweetMutationResponse>(`/api/tweets/${tweetId}/like`);
        set((state) => ({
          feed: state.feed.map((tweet) =>
            tweet.id === tweetId
              ? { ...tweet, likesCount: response.data.likesCount ?? tweet.likesCount }
              : tweet
          ),
          likedIds: updateSet(response.data.likedIds),
        }));
      },

      toggleRetweet: async (tweetId) => {
        const response = await apiClient.post<TweetMutationResponse>(`/api/tweets/${tweetId}/retweet`);
        set((state) => ({
          feed: state.feed.map((tweet) =>
            tweet.id === tweetId
              ? { ...tweet, retweetsCount: response.data.retweetsCount ?? tweet.retweetsCount }
              : tweet
          ),
          retweetedIds: updateSet(response.data.retweetedIds),
        }));
      },

      toggleBookmark: async (tweetId) => {
        const response = await apiClient.post<TweetMutationResponse>(`/api/tweets/${tweetId}/bookmark`);
        set((state) => ({
          feed: state.feed.map((tweet) =>
            tweet.id === tweetId
              ? { ...tweet, bookmarksCount: response.data.bookmarksCount ?? tweet.bookmarksCount }
              : tweet
          ),
          bookmarkedIds: updateSet(response.data.bookmarkedIds),
        }));
      },

      votePollOption: async (tweetId, optionId) => {
        const response = await apiClient.post<TweetMutationResponse>(`/api/tweets/${tweetId}/poll-vote`, { optionId });
        if (!response.data.poll) return;

        set((state) => ({
          feed: state.feed.map((tweet) =>
            tweet.id === tweetId
              ? { ...tweet, poll: response.data.poll }
              : tweet
          ),
        }));
      },
    }),
    { name: 'tweet-store' }
  )
);
