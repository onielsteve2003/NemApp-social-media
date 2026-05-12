import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';
import type { UserProfile } from '@shared-types';

interface SocialState {
  followingIds: string[];
  followerIds: string[];
  profilesById: Record<string, UserProfile>;
  fetchRelationships: () => Promise<void>;
  toggleFollow: (userId: string) => Promise<void>;
  isFollowing: (userId: string) => boolean;
  hydrateProfiles: (profiles: UserProfile[]) => void;
}

interface RelationshipsResponse {
  success: boolean;
  data: {
    followingIds: string[];
    followerIds: string[];
    targetProfile?: UserProfile;
  };
}

function mergeProfiles(
  currentProfiles: Record<string, UserProfile>,
  profiles: UserProfile[]
) {
  if (profiles.length === 0) {
    return currentProfiles;
  }

  const nextProfiles = { ...currentProfiles };
  for (const profile of profiles) {
    nextProfiles[profile.id] = profile;
  }
  return nextProfiles;
}

function syncAuthUserCounts(followingIds: string[], followerIds: string[]) {
  const authState = useAuthStore.getState();
  if (!authState.user) return;

  if (
    authState.user.followingCount === followingIds.length
    && authState.user.followersCount === followerIds.length
  ) {
    return;
  }

  useAuthStore.setState({
    user: {
      ...authState.user,
      followingCount: followingIds.length,
      followersCount: followerIds.length,
    },
  });
}

export const useSocialStore = create<SocialState>()(
  devtools(
    persist(
      (set, get) => ({
        followingIds: [],
        followerIds: [],
        profilesById: {},

        fetchRelationships: async () => {
          const currentUser = useAuthStore.getState().user;
          if (!currentUser) {
            set({ followingIds: [], followerIds: [] });
            return;
          }

          const response = await apiClient.get<RelationshipsResponse>('/api/users/me/relationships');
          const followingIds = response.data.followingIds ?? [];
          const followerIds = response.data.followerIds ?? [];
          set({ followingIds, followerIds });
          syncAuthUserCounts(followingIds, followerIds);
        },

        toggleFollow: async (userId: string) => {
          const response = await apiClient.post<RelationshipsResponse>(`/api/users/${userId}/follow-toggle`);
          const followingIds = response.data.followingIds ?? [];
          const followerIds = response.data.followerIds ?? get().followerIds;
          const targetProfile = response.data.targetProfile;
          set((state) => ({
            followingIds,
            followerIds,
            profilesById: targetProfile
              ? mergeProfiles(state.profilesById, [targetProfile])
              : state.profilesById,
          }));
          syncAuthUserCounts(followingIds, followerIds);
        },

        isFollowing: (userId: string) => get().followingIds.includes(userId),

        hydrateProfiles: (profiles: UserProfile[]) => {
          set((state) => ({
            profilesById: mergeProfiles(state.profilesById, profiles),
          }));
        },
      }),
      {
        name: 'social-storage',
        version: 3,
        migrate: (persistedState) => {
          if (!persistedState || typeof persistedState !== 'object') {
            return persistedState;
          }

          return {
            ...persistedState,
            followerIds: [],
            profilesById: {},
          };
        },
      }
    ),
    { name: 'social-store' }
  )
);
