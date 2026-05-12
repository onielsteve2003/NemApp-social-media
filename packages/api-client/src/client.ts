import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class ApiClient {
  private client: AxiosInstance;

  private getStorage(): {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  } | null {
    const globalObject = globalThis as {
      localStorage?: {
        getItem: (key: string) => string | null;
        setItem: (key: string, value: string) => void;
        removeItem: (key: string) => void;
      };
    };
    return globalObject.localStorage ?? null;
  }

  private reloadPage(): void {
    const globalObject = globalThis as {
      location?: {
        reload?: () => void;
      };
    };
    globalObject.location?.reload?.();
  }

  constructor(config: ApiClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - clear auth and redirect
          this.clearAuthToken();
          this.reloadPage();
        }
        return Promise.reject(error.response?.data || error.message);
      }
    );
  }

  async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.get<T, T>(url, config);
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.post<T, T>(url, data, config);
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.put<T, T>(url, data, config);
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.patch<T, T>(url, data, config);
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.delete<T, T>(url, config);
  }

  setAuthToken(token: string): void {
    this.getStorage()?.setItem('auth_token', token);
  }

  getAuthToken(): string | null {
    return this.getStorage()?.getItem('auth_token') ?? null;
  }

  clearAuthToken(): void {
    this.getStorage()?.removeItem('auth_token');
  }

  setRefreshToken(token: string): void {
    this.getStorage()?.setItem('refresh_token', token);
  }

  getRefreshToken(): string | null {
    return this.getStorage()?.getItem('refresh_token') ?? null;
  }
}
