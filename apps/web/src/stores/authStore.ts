import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { User } from '@shared-types';
import { mockAuthService } from '@/mocks/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        refreshToken: null,
        isLoading: false,
        error: null,

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await mockAuthService.login(email, password);
            set({
              user: response.user,
              token: response.token,
              refreshToken: response.refreshToken,
              isLoading: false,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Login failed';
            set({
              error: message,
              isLoading: false,
            });
            throw error;
          }
        },

        register: async (
          username: string,
          email: string,
          password: string,
          displayName: string
        ) => {
          set({ isLoading: true, error: null });
          try {
            const response = await mockAuthService.register(
              username,
              email,
              password,
              displayName
            );
            set({
              user: response.user,
              token: response.token,
              refreshToken: response.refreshToken,
              isLoading: false,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Registration failed';
            set({
              error: message,
              isLoading: false,
            });
            throw error;
          }
        },

        logout: async () => {
          set({ isLoading: true });
          try {
            await mockAuthService.logout();
            set({
              user: null,
              token: null,
              refreshToken: null,
              isLoading: false,
            });
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },

        clearError: () => set({ error: null }),

        setUser: (user: User | null) => set({ user }),
      }),
      {
        name: 'auth-storage',
      }
    )
  )
);

// Selector hooks for better performance
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthToken = () => useAuthStore((state) => state.token);
export const useAuthIsLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useIsAuthenticated = () => useAuthStore((state) => state.user !== null);
