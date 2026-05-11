import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface SocialState {
  followingIds: string[];
  toggleFollow: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
}

export const useSocialStore = create<SocialState>()(
  devtools(
    persist(
      (set, get) => ({
        followingIds: [],

        toggleFollow: (userId: string) => {
          const exists = get().followingIds.includes(userId);
          set((state) => ({
            followingIds: exists
              ? state.followingIds.filter((id) => id !== userId)
              : [...state.followingIds, userId],
          }));
        },

        isFollowing: (userId: string) => get().followingIds.includes(userId),
      }),
      {
        name: 'social-storage',
      }
    ),
    { name: 'social-store' }
  )
);
