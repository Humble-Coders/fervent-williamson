// Core API exports
export { apiClient, api, apiCall, TokenManager } from './api';
export { BaseService, createService } from './BaseService';

// Service layer barrel exports
export { authService } from './authService';
export { salonService } from './salonService';
export * from './bookingService';
export * from './reviewService';
export { categoryService } from './categoryService';
export { serviceService } from './serviceService';
export * from './offerService';
export * from './uploadService';
export * from './adminService';
export * from './configService';

// Enhanced service utilities
export const serviceUtils = {
  /**
   * Handle API errors consistently
   */
  handleApiError: (error: any): string => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  /**
   * Format API response for consistent handling
   */
  formatResponse: <T>(response: any): T => {
    if (response.data) {
      return response.data;
    }
    return response;
  },

  /**
   * Create query string from parameters
   */
  createQueryString: (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    return searchParams.toString();
  },

  /**
   * Debounce function for search operations
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Retry function for failed API calls
   */
  retry: async <T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return serviceUtils.retry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  },
};

// Backward compatibility exports
export const handleApiError = serviceUtils.handleApiError;

export const createApiResponse = <T>(data: T, message?: string) => ({
  success: true,
  data,
  message: message || 'Operation successful',
});

export const createApiError = (message: string, status = 500) => ({
  success: false,
  message,
  status,
});
