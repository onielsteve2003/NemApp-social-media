import { ApiClient } from '@api-client';

export const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  timeout: 12000,
});

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const errorObject = error as { error?: { message?: string }; message?: string };
    if (errorObject.error?.message) return errorObject.error.message;
    if (errorObject.message) return errorObject.message;
  }
  return fallback;
}

export function shouldFallbackToMock(error: unknown) {
  const message = getApiErrorMessage(error, '').toLowerCase();
  return (
    message.includes('network error') ||
    message.includes('econnrefused') ||
    message.includes('failed to fetch') ||
    message.includes('timeout')
  );
}