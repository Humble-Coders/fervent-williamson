import axios, { AxiosError, AxiosResponse } from 'axios';
import { logger } from '@/config/logger';
import { env } from '../config/env';

// API response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Create axios instance with default config
const api = axios.create({
  baseURL: env.API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
    };

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          const errorData = data as any;
          if (errorData?.code === 'TOKEN_EXPIRED') {
            apiError.message = 'Your session has expired. Please log in again.';
            logger.info('🔄 Token expired, clearing auth state...');
          } else if (errorData?.code === 'INVALID_TOKEN') {
            apiError.message = 'Invalid authentication. Please log in again.';
            logger.info('🚫 Invalid token, clearing auth state...');
          } else {
            apiError.message = 'Authentication required';
            logger.info('🔐 Authentication required, clearing auth state...');
          }

          // Clear token and auth state (only on client side)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
          }

          // Clear auth store state (only on client side)
          if (typeof window !== 'undefined') {
            try {
              const { useAuthStore } = await import('../store/authStore');
              useAuthStore.getState().logout();
              logger.info('✅ Auth state cleared');
            } catch (error) {
              logger.error('❌ Failed to clear auth state:', error);
            }
          }

          // Don't redirect automatically - let components handle login prompts
          break;
        case 403:
          apiError.message = 'Access denied';
          break;
        case 404:
          apiError.message = 'Resource not found';
          break;
        case 422:
          apiError.message = 'Validation error';
          apiError.details = data;
          break;
        case 500:
          apiError.message = 'Server error. Please try again later.';
          break;
        default:
          apiError.message = (data as any)?.message || 'An error occurred';
      }
      
      apiError.code = status.toString();
    } else if (error.request) {
      // Network error
      apiError.message = 'Network error. Please check your connection.';
      apiError.code = 'NETWORK_ERROR';
    }

    return Promise.reject(apiError);
  }
);

export default api;