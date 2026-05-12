import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { User } from '@shared-types';
import { ApiClient } from '@api-client';
import { mockAuthService } from '@/mocks/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  autoDemoEnabled: boolean;

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

const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  timeout: 12000,
});

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const errorObject = error as { error?: { message?: string }; message?: string };
    if (errorObject.error?.message) return errorObject.error.message;
    if (errorObject.message) return errorObject.message;
  }
  return fallback;
}

function shouldFallbackToMock(error: unknown) {
  const message = getErrorMessage(error, '').toLowerCase();
  return (
    message.includes('network error') ||
    message.includes('econnrefused') ||
    message.includes('failed to fetch') ||
    message.includes('timeout')
  );
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
                const fallbackMessage = getErrorMessage(fallbackError, 'Login failed');
                set({
                  error: fallbackMessage,
                  isLoading: false,
                });
                throw fallbackError;
              }
            }

            const message =
              getErrorMessage(error, 'Login failed');
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
                const fallbackMessage = getErrorMessage(fallbackError, 'Registration failed');
                set({
                  error: fallbackMessage,
                  isLoading: false,
                });
                throw fallbackError;
              }
            }

            const message =
              getErrorMessage(error, 'Registration failed');
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
