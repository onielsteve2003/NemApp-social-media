import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { NotificationType, NotificationWithActor, User, UserProfile } from '@shared-types';
import { MOCK_USERS } from '@/mocks/auth';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

interface NotificationState {
  notifications: NotificationWithActor[];
  initializedForUserIds: string[];

  seedNotifications: (userId: string) => void;
  addNotification: (
    userId: string,
    actorId: string,
    type: NotificationType,
    targetId?: string
  ) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (userId: string) => void;
  clearAll: (userId: string) => void;
}

let notificationIdCounter = 1;

function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatar: user.avatar,
    coverImage: user.coverImage,
    location: user.location,
    website: user.website,
    birthDate: user.birthDate,
    isPrivate: user.isPrivate,
    isVerified: user.isVerified,
    role: user.role,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    tweetsCount: user.tweetsCount,
    likesCount: user.likesCount,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
}

function getUserById(userId: string): User | null {
  const authUser = useAuthStore.getState().user;
  if (authUser?.id === userId) {
    return authUser;
  }
  return MOCK_USERS.find((user) => user.id === userId) ?? null;
}

function isNotificationEnabled(type: NotificationType): boolean {
  const prefs = useSettingsStore.getState().notificationPreferences;
  switch (type) {
    case 'like':
      return prefs.likes;
    case 'follow':
      return prefs.follows;
    case 'reply':
      return prefs.replies;
    case 'mention':
      return prefs.mentions;
    case 'message':
      return prefs.messages;
    case 'retweet':
      return prefs.replies;
    default:
      return true;
  }
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set, get) => ({
        notifications: [],
        initializedForUserIds: [],

        seedNotifications: (userId) => {
          const { initializedForUserIds } = get();
          if (initializedForUserIds.includes(userId)) return;

          const actors = MOCK_USERS.filter((u) => u.id !== userId);
          if (actors.length === 0) return;

          const seeded: NotificationWithActor[] = [
            {
              id: `notif-${notificationIdCounter++}`,
              userId,
              actorId: actors[0].id,
              type: 'follow',
              isRead: false,
              createdAt: new Date(Date.now() - 1000 * 60 * 20),
              actor: toUserProfile(actors[0]),
            },
            {
              id: `notif-${notificationIdCounter++}`,
              userId,
              actorId: actors[1 % actors.length].id,
              type: 'like',
              targetId: 'tweet-1',
              isRead: false,
              createdAt: new Date(Date.now() - 1000 * 60 * 8),
              actor: toUserProfile(actors[1 % actors.length]),
            },
            {
              id: `notif-${notificationIdCounter++}`,
              userId,
              actorId: actors[0].id,
              type: 'mention',
              targetId: 'tweet-2',
              isRead: true,
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
              actor: toUserProfile(actors[0]),
            },
          ];

          set((state) => ({
            notifications: [...seeded, ...state.notifications],
            initializedForUserIds: [...state.initializedForUserIds, userId],
          }));
        },

        addNotification: (userId, actorId, type, targetId) => {
          if (!isNotificationEnabled(type)) return;
          if (actorId === userId) return;

          const blockedUserIds = useSettingsStore.getState().blockedUserIds;
          if (blockedUserIds.includes(actorId)) return;

          const actor = getUserById(actorId);
          if (!actor) return;

          const item: NotificationWithActor = {
            id: `notif-${notificationIdCounter++}`,
            userId,
            actorId,
            type,
            targetId,
            isRead: false,
            createdAt: new Date(),
            actor: toUserProfile(actor),
          };

          set((state) => ({
            notifications: [item, ...state.notifications],
          }));
        },

        markAsRead: (notificationId) => {
          set((state) => ({
            notifications: state.notifications.map((item) =>
              item.id === notificationId ? { ...item, isRead: true } : item
            ),
          }));
        },

        markAllAsRead: (userId) => {
          set((state) => ({
            notifications: state.notifications.map((item) =>
              item.userId === userId ? { ...item, isRead: true } : item
            ),
          }));
        },

        clearAll: (userId) => {
          set((state) => ({
            notifications: state.notifications.filter((item) => item.userId !== userId),
          }));
        },
      }),
      {
        name: 'notification-storage',
      }
    ),
    { name: 'notification-store' }
  )
);
