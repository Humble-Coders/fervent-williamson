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

// Service utilities
export const serviceUtils = {
  /**
   * Extract error message from Firebase/generic errors
   */
  handleError: (error: any): string => {
    if (error.code) return error.message || error.code;
    if (error.message) return error.message;
    return 'An unexpected error occurred';
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
   * Retry function for failed operations
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
