import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { User } from '@shared-types';
import { mockAuthService } from '@/mocks/auth';
import { apiClient, getApiErrorMessage, shouldFallbackToMock } from '@/lib/apiClient';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  autoDemoEnabled: boolean;
  hasHydrated: boolean;

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
  setAutoDemoEnabled: (enabled: boolean) => void;
}

interface AuthApiResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
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
        autoDemoEnabled: true,
        hasHydrated: false,

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await apiClient.post<AuthApiResponse>('/api/auth/login', {
              email,
              password,
            });

            apiClient.setAuthToken(response.data.accessToken);
            apiClient.setRefreshToken(response.data.refreshToken);
            set({
              user: response.data.user,
              token: response.data.accessToken,
              refreshToken: response.data.refreshToken,
              autoDemoEnabled: true,
              isLoading: false,
            });
          } catch (error) {
            if (shouldFallbackToMock(error)) {
              try {
                const fallbackResponse = await mockAuthService.login(email, password);
                set({
                  user: fallbackResponse.user,
                  token: fallbackResponse.token,
                  refreshToken: fallbackResponse.refreshToken,
                  autoDemoEnabled: true,
                  isLoading: false,
                });
                return;
              } catch (fallbackError) {
                const fallbackMessage = getApiErrorMessage(fallbackError, 'Login failed');
                set({
                  error: fallbackMessage,
                  isLoading: false,
                });
                throw fallbackError;
              }
            }

            const message =
              getApiErrorMessage(error, 'Login failed');
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
            const response = await apiClient.post<AuthApiResponse>('/api/auth/register', {
              username,
              email,
              password,
              displayName,
            });

            apiClient.setAuthToken(response.data.accessToken);
            apiClient.setRefreshToken(response.data.refreshToken);
            set({
              user: response.data.user,
              token: response.data.accessToken,
              refreshToken: response.data.refreshToken,
              autoDemoEnabled: true,
              isLoading: false,
            });
          } catch (error) {
            if (shouldFallbackToMock(error)) {
              try {
                const fallbackResponse = await mockAuthService.register(
                  username,
                  email,
                  password,
                  displayName
                );
                set({
                  user: fallbackResponse.user,
                  token: fallbackResponse.token,
                  refreshToken: fallbackResponse.refreshToken,
                  autoDemoEnabled: true,
                  isLoading: false,
                });
                return;
              } catch (fallbackError) {
                const fallbackMessage = getApiErrorMessage(fallbackError, 'Registration failed');
                set({
                  error: fallbackMessage,
                  isLoading: false,
                });
                throw fallbackError;
              }
            }

            const message =
              getApiErrorMessage(error, 'Registration failed');
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
            try {
              await apiClient.post('/api/auth/logout');
            } catch {
              await mockAuthService.logout();
            }
            apiClient.clearAuthToken();
            set({
              user: null,
              token: null,
              refreshToken: null,
              autoDemoEnabled: false,
              isLoading: false,
            });
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },

        clearError: () => set({ error: null }),

        setUser: (user: User | null) => set({ user }),
        setAutoDemoEnabled: (enabled: boolean) => set({ autoDemoEnabled: enabled }),
      }),
      {
        name: 'auth-storage',
        onRehydrateStorage: () => (state) => {
          if (state?.token) {
            apiClient.setAuthToken(state.token);
          }

          if (state?.refreshToken) {
            apiClient.setRefreshToken(state.refreshToken);
          }

          useAuthStore.setState({ hasHydrated: true });
        },
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
