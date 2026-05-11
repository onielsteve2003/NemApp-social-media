import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light' | 'system';

interface NotificationPreferences {
  likes: boolean;
  follows: boolean;
  replies: boolean;
  mentions: boolean;
  messages: boolean;
}

interface PrivacyPreferences {
  isPrivateAccount: boolean;
  hideEmail: boolean;
  allowMessagesFromEveryone: boolean;
}

interface SettingsState {
  theme: ThemeMode;
  notificationPreferences: NotificationPreferences;
  privacyPreferences: PrivacyPreferences;
  blockedUserIds: string[];

  setTheme: (theme: ThemeMode) => void;
  toggleNotificationPref: (key: keyof NotificationPreferences) => void;
  togglePrivacyPref: (key: keyof PrivacyPreferences) => void;
  toggleBlockedUser: (userId: string) => void;
  isUserBlocked: (userId: string) => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set, get) => ({
        theme: 'dark',
        notificationPreferences: {
          likes: true,
          follows: true,
          replies: true,
          mentions: true,
          messages: true,
        },
        privacyPreferences: {
          isPrivateAccount: false,
          hideEmail: false,
          allowMessagesFromEveryone: true,
        },
        blockedUserIds: [],

        setTheme: (theme) => set({ theme }),

        toggleNotificationPref: (key) => {
          set((state) => ({
            notificationPreferences: {
              ...state.notificationPreferences,
              [key]: !state.notificationPreferences[key],
            },
          }));
        },

        togglePrivacyPref: (key) => {
          set((state) => ({
            privacyPreferences: {
              ...state.privacyPreferences,
              [key]: !state.privacyPreferences[key],
            },
          }));
        },

        toggleBlockedUser: (userId) => {
          const blocked = get().blockedUserIds.includes(userId);
          set((state) => ({
            blockedUserIds: blocked
              ? state.blockedUserIds.filter((id) => id !== userId)
              : [...state.blockedUserIds, userId],
          }));
        },

        isUserBlocked: (userId) => get().blockedUserIds.includes(userId),
      }),
      {
        name: 'settings-storage',
      }
    ),
    { name: 'settings-store' }
  )
);
