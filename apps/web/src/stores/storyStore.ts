import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { MediaItem, StoryWithAuthor } from '@shared-types';
import { MOCK_USERS } from '@/mocks/auth';
import { useAuthStore } from '@/stores/authStore';

interface StoryState {
  stories: StoryWithAuthor[];
  initialized: boolean;
  seedStories: () => void;
  createStory: (
    authorId: string,
    caption: string,
    background: string,
    media?: MediaItem
  ) => void;
  markSeen: (storyId: string, viewerId: string) => void;
  removeExpiredStories: () => void;
}

const STORY_BACKGROUNDS = [
  'linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 100%)',
  'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
  'linear-gradient(135deg, #ec4899 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #facc15 0%, #f97316 100%)',
];

let storyIdCounter = 1;

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

function makeSeedStories(): StoryWithAuthor[] {
  const now = Date.now();

  return MOCK_USERS.slice(0, 6).map((user, index) => ({
    id: `story-${storyIdCounter++}`,
    authorId: user.id,
    caption:
      index % 2 === 0
        ? 'A quick pulse from my day on NemApp.'
        : 'Shipping, sketching, and collecting ideas.',
    background: STORY_BACKGROUNDS[index % STORY_BACKGROUNDS.length],
    media:
      index % 3 === 0
        ? {
            url: `https://images.unsplash.com/photo-${1500000000000 + index * 4321}?w=900&h=1600&fit=crop`,
            type: 'image',
            alt: `${user.displayName} story`,
          }
        : undefined,
    viewersCount: 18 + index * 9,
    seenBy: index % 2 === 0 ? ['user-1'] : [],
    createdAt: new Date(now - index * 1000 * 60 * 43),
    expiresAt: new Date(now + (24 - index) * 1000 * 60 * 60),
    author: toAuthorProfile(user),
  }));
}

export const useStoryStore = create<StoryState>()(
  devtools(
    persist(
      (set, get) => ({
        stories: [],
        initialized: false,

        seedStories: () => {
          if (get().initialized) return;
          set({
            stories: makeSeedStories(),
            initialized: true,
          });
        },

        createStory: (authorId, caption, background, media) => {
          const author =
            useAuthStore.getState().user?.id === authorId
              ? useAuthStore.getState().user
              : MOCK_USERS.find((user) => user.id === authorId);

          if (!author) return;

          const story: StoryWithAuthor = {
            id: `story-${storyIdCounter++}`,
            authorId,
            caption,
            background,
            media,
            viewersCount: 0,
            seenBy: [],
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            author: toAuthorProfile(author),
          };

          set((state) => ({
            stories: [story, ...state.stories.filter((item) => item.authorId !== authorId)],
          }));
        },

        markSeen: (storyId, viewerId) => {
          set((state) => ({
            stories: state.stories.map((story) => {
              if (story.id !== storyId || story.seenBy.includes(viewerId)) {
                return story;
              }

              return {
                ...story,
                seenBy: [...story.seenBy, viewerId],
                viewersCount: story.viewersCount + 1,
              };
            }),
          }));
        },

        removeExpiredStories: () => {
          const now = Date.now();
          set((state) => ({
            stories: state.stories.filter(
              (story) => new Date(story.expiresAt).getTime() > now
            ),
          }));
        },
      }),
      {
        name: 'story-storage',
      }
    ),
    { name: 'story-store' }
  )
);
