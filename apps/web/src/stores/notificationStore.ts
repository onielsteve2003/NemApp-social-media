import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { NotificationWithActor } from '@shared-types';
import { apiClient } from '@/lib/apiClient';

interface NotificationResponse {
  success: boolean;
  data: {
    notifications?: NotificationWithActor[];
  };
}

interface NotificationState {
  notifications: NotificationWithActor[];
  initializedForUserIds: string[];
  seedNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  clearAll: (userId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set) => ({
      notifications: [],
      initializedForUserIds: [],

      seedNotifications: async (userId) => {
        const response = await apiClient.get<NotificationResponse>('/api/notifications');
        set((state) => ({
          notifications: response.data.notifications ?? [],
          initializedForUserIds: state.initializedForUserIds.includes(userId)
            ? state.initializedForUserIds
            : [...state.initializedForUserIds, userId],
        }));
      },

      markAsRead: async (notificationId) => {
        await apiClient.post(`/api/notifications/${notificationId}/read`);
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === notificationId ? { ...item, isRead: true } : item
          ),
        }));
      },

      markAllAsRead: async (userId) => {
        await apiClient.post('/api/notifications/read-all');
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.userId === userId ? { ...item, isRead: true } : item
          ),
        }));
      },

      clearAll: async (userId) => {
        await apiClient.delete('/api/notifications/clear');
        set((state) => ({
          notifications: state.notifications.filter((item) => item.userId !== userId),
        }));
      },
    }),
    { name: 'notification-store' }
  )
);
