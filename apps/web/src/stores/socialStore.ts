import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

const DEFAULT_FOLLOWER_IDS = ['user-2', 'user-4'];

interface SocialState {
  followingIds: string[];
  followerIds: string[];
  toggleFollow: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
}

export const useSocialStore = create<SocialState>()(
  devtools(
    persist(
      (set, get) => ({
        followingIds: [],
        followerIds: DEFAULT_FOLLOWER_IDS,

        toggleFollow: (userId: string) => {
          const exists = get().followingIds.includes(userId);
          set((state) => ({
            followingIds: exists
              ? state.followingIds.filter((id) => id !== userId)
              : [...state.followingIds, userId],
          }));

          if (!exists) {
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
              useNotificationStore
                .getState()
                .addNotification(currentUser.id, userId, 'follow', currentUser.id);
            }
          }
        },

        isFollowing: (userId: string) => get().followingIds.includes(userId),
      }),
      {
        name: 'social-storage',
        version: 2,
        migrate: (persistedState) => {
          if (!persistedState || typeof persistedState !== 'object') {
            return persistedState;
          }

          return {
            ...persistedState,
            followerIds:
              Array.isArray((persistedState as { followerIds?: string[] }).followerIds)
                ? (persistedState as { followerIds: string[] }).followerIds
                : DEFAULT_FOLLOWER_IDS,
          };
        },
      }
    ),
    { name: 'social-store' }
  )
);
