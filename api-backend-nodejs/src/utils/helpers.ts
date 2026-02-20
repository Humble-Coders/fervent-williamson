import { PaginationOptions, PaginationResult } from '@/types';

/**
 * Create a standardized API response
 */
export const createResponse = <T>(
  success: boolean,
  data?: T,
  message?: string,
  pagination?: any
) => {
  const response: any = { success };
  
  if (data !== undefined) response.data = data;
  if (message) response.message = message;
  if (pagination) response.pagination = pagination;
  
  return response;
};

/**
 * Create a standardized error response
 */
export const createErrorResponse = (
  message: string,
  code?: string,
  details?: any
) => {
  return {
    success: false,
    error: {
      message,
      code,
      details,
    },
  };
};

/**
 * Calculate pagination metadata
 */
export const calculatePagination = (
  page: number,
  limit: number,
  total: number
) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
};

/**
 * Create paginated response
 */
export const createPaginatedResponse = <T>(
  data: T[],
  pagination: PaginationOptions,
  total: number
): PaginationResult<T> => {
  const paginationMeta = calculatePagination(
    pagination.page,
    pagination.limit,
    total
  );

  return {
    data,
    pagination: paginationMeta,
  };
};

/**
 * Generate a random string
 */
export const generateRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a random number within a range
 */
export const generateRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Sleep for a specified number of milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Capitalize the first letter of a string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert string to title case
 */
export const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Convert string to camelCase
 */
export const toCamelCase = (str: string): string => {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
};

/**
 * Convert string to snake_case
 */
export const toSnakeCase = (str: string): string => {
  return str.replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('_');
};

/**
 * Remove undefined and null values from an object
 */
export const removeNullish = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const result: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      result[key as keyof T] = value;
    }
  }
  
  return result;
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Retry function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
  
  throw lastError!;
};

/**
 * Format currency
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (
  date: Date | string,
  format: string = 'YYYY-MM-DD',
  locale: string = 'en-US'
): string => {
  const d = new Date(date);
  
  switch (format) {
    case 'YYYY-MM-DD':
      return d.toISOString().split('T')[0]!;
    case 'DD/MM/YYYY':
      return d.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    case 'MM/DD/YYYY':
      return d.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
    case 'long':
      return d.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    default:
      return d.toLocaleDateString(locale);
  }
};

/**
 * Format time
 */
export const formatTime = (
  date: Date | string,
  format: '12h' | '24h' = '12h',
  locale: string = 'en-US'
): string => {
  const d = new Date(date);
  
  return d.toLocaleTimeString(locale, {
    hour12: format === '12h',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: Date | string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Normalize phone number for database storage (remove country code prefix)
 * Converts +919321965955 or 919321965955 to 9321965955
 */
export const normalizePhoneForDB = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Remove country code (91) if present
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned.substring(2); // Return 10-digit number
  }

  return cleaned; // Already 10 digits or other format
};

/**
 * Format phone number for OTP operations (add country code prefix)
 * Converts 9321965955 to +919321965955
 */
export const formatPhoneForOTP = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // If already has country code
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }

  // If 10 digits, add country code
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }

  // Return as is with + prefix if not already present
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
};
