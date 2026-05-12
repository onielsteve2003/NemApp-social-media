import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { MediaItem, StoryWithAuthor } from '@shared-types';
import { apiClient } from '@/lib/apiClient';

interface StoryResponse {
  success: boolean;
  data: {
    stories?: StoryWithAuthor[];
    story?: StoryWithAuthor;
    likedBy?: string[];
  };
}

interface StoryState {
  stories: StoryWithAuthor[];
  initialized: boolean;
  seedStories: () => Promise<void>;
  createStory: (
    authorId: string,
    caption: string,
    background: string,
    media?: MediaItem
  ) => Promise<string>;
  markSeen: (storyId: string, viewerId: string) => Promise<void>;
  toggleLike: (storyId: string, userId: string) => Promise<void>;
  deleteStory: (storyId: string, requesterId: string) => Promise<void>;
  reshareStory: (storyId: string, resharedById: string) => Promise<string>;
  removeExpiredStories: () => void;
}

export const useStoryStore = create<StoryState>()(
  devtools(
    (set) => ({
      stories: [],
      initialized: false,

      seedStories: async () => {
        const response = await apiClient.get<StoryResponse>('/api/stories/feed');
        set({
          stories: response.data.stories ?? [],
          initialized: true,
        });
      },

      createStory: async (_authorId, caption, background, media) => {
        const response = await apiClient.post<StoryResponse>('/api/stories', {
          caption,
          background,
          media,
        });
        const story = response.data.story;
        if (!story) return '';

        set((state) => ({
          stories: [story, ...state.stories],
        }));
        return story.id;
      },

      markSeen: async (storyId, viewerId) => {
        await apiClient.post(`/api/stories/${storyId}/seen`);
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id !== storyId || story.seenBy.includes(viewerId)
              ? story
              : {
                  ...story,
                  seenBy: [...story.seenBy, viewerId],
                  viewersCount: story.viewersCount + 1,
                }
          ),
        }));
      },

      toggleLike: async (storyId, _userId) => {
        const response = await apiClient.post<StoryResponse>(`/api/stories/${storyId}/like`);
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === storyId
              ? { ...story, likedBy: response.data.likedBy ?? story.likedBy }
              : story
          ),
        }));
      },

      deleteStory: async (storyId, _requesterId) => {
        await apiClient.delete(`/api/stories/${storyId}`);
        set((state) => ({
          stories: state.stories.filter((story) => story.id !== storyId),
        }));
      },

      reshareStory: async (storyId, _resharedById) => {
        const response = await apiClient.post<StoryResponse>(`/api/stories/${storyId}/reshare`);
        const story = response.data.story;
        if (!story) return '';

        set((state) => ({
          stories: [story, ...state.stories],
        }));
        return story.id;
      },

      removeExpiredStories: () => {
        const now = Date.now();
        set((state) => ({
          stories: state.stories.filter((story) => new Date(story.expiresAt).getTime() > now),
        }));
      },
    }),
    { name: 'story-store' }
  )
);
