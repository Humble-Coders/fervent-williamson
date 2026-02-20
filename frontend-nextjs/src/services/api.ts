import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, ApiError } from '../types/api';
import { errorHandler } from '../utils/errorHandler';
import { env } from '../config/env';

// Token management
class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}

// API Client class
class ApiClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }> = [];

  constructor(baseURL: string) {
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only add ngrok header when using ngrok URLs
    if (baseURL.includes('ngrok-free.app')) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }

    this.instance = axios.create({
      baseURL,
      timeout: 30000,
      headers,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = TokenManager.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.instance(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = TokenManager.getRefreshToken();
            if (refreshToken) {
              const response = await this.instance.post('/auth/refresh', {
                refreshToken,
              });

              const { token } = (response.data as any).data;
              TokenManager.setToken(token);

              this.failedQueue.forEach(({ resolve }) => resolve(token));
              this.failedQueue = [];

              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            this.failedQueue.forEach(({ reject }) => reject(refreshError));
            this.failedQueue = [];
            TokenManager.clearTokens();
            window.location.href = '/login';
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle all other errors with enhanced error handler
        // Don't show toast for authentication errors during silent operations
        const isAuthError = error.response?.status === 401;
        const isSilentAuthOperation = error.config?.url?.includes('/auth/profile') ||
                                     error.config?.url?.includes('/categories/dashboard-visibility');

        if (!(isAuthError && isSilentAuthOperation)) {
          errorHandler.handleApiError(error);
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic HTTP methods
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.get(url, config);
    return response.data;
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.post(url, data, config);
    return response.data;
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.put(url, data, config);
    return response.data;
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.patch(url, data, config);
    return response.data;
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.delete(url, config);
    return response.data;
  }

  // File upload method
  async upload<T = unknown>(url: string, file: File, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.instance.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });

    return response.data;
  }

  // Multiple file upload
  async uploadMultiple<T = unknown>(url: string, files: File[], config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    const response = await this.instance.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });

    return response.data;
  }

  // Paginated requests
  async getPaginated<T = unknown>(
    url: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      [key: string]: unknown;
    },
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T[]>> {
    const response = await this.instance.get(url, {
      ...config,
      params: {
        page: 1,
        limit: 10,
        ...params,
      },
    });

    return response.data;
  }

  // Batch operations
  async batch<T = unknown>(requests: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    data?: unknown;
  }>): Promise<ApiResponse<T[]>> {
    const promises = requests.map(({ method, url, data }) => {
      switch (method) {
        case 'GET':
          return this.get(url);
        case 'POST':
          return this.post(url, data);
        case 'PUT':
          return this.put(url, data);
        case 'PATCH':
          return this.patch(url, data);
        case 'DELETE':
          return this.delete(url);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    });

    const results = await Promise.allSettled(promises);
    return {
      success: true,
      data: results.map((result) =>
        result.status === 'fulfilled' ? result.value.data : null
      ) as T[],
    };
  }

  // Get raw axios instance for advanced usage
  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient(env.API_URL);

// Export the axios instance for backward compatibility
export const api = apiClient.getInstance();

// Export token manager
export { TokenManager };

// Generic API call function for backward compatibility
export const apiCall = async (url: string, options?: {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}) => {
  const method = (options?.method || 'GET').toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';

  switch (method) {
    case 'get':
      return apiClient.get(url, { headers: options?.headers });
    case 'post':
      return apiClient.post(url, options?.body, { headers: options?.headers });
    case 'put':
      return apiClient.put(url, options?.body, { headers: options?.headers });
    case 'patch':
      return apiClient.patch(url, options?.body, { headers: options?.headers });
    case 'delete':
      return apiClient.delete(url, { headers: options?.headers });
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
};
