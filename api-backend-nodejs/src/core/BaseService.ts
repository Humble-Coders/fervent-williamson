/**
 * Base Service Class
 * Provides common functionality for all services
 */

import { ServiceResponse, ILogger } from '../interfaces/services';
import { getService } from './container';

export abstract class BaseService {
  protected logger: ILogger;

  constructor() {
    this.logger = getService<ILogger>('logger');
  }

  /**
   * Create a successful service response
   */
  protected success<T>(data?: T, message: string = 'Operation successful'): ServiceResponse<T> {
    return {
      success: true,
      message,
      data
    };
  }

  /**
   * Create an error service response
   */
  protected error(message: string, error?: string): ServiceResponse<never> {
    this.logger.error(message, { error });
    return {
      success: false,
      message,
      error
    };
  }

  /**
   * Handle async operations with error catching
   */
  protected async handleAsync<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Operation failed'
  ): Promise<ServiceResponse<T>> {
    try {
      const result = await operation();
      return this.success(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return this.error(errorMessage, errorMsg);
    }
  }

  /**
   * Validate required fields
   */
  protected validateRequired(data: Record<string, any>, fields: string[]): string[] {
    const missing: string[] = [];
    
    for (const field of fields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        missing.push(field);
      }
    }
    
    return missing;
  }

  /**
   * Validate email format
   */
  protected isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format (basic validation)
   */
  protected isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Sanitize string input
   */
  protected sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Generate random string
   */
  protected generateRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate numeric OTP
   */
  protected generateNumericOTP(length: number = 6): string {
    const digits = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return result;
  }

  /**
   * Check if running in development mode
   */
  protected isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * Log service operation
   */
  protected logOperation(operation: string, data?: any): void {
    this.logger.info(`${this.constructor.name}: ${operation}`, data);
  }

  /**
   * Log service error
   */
  protected logError(operation: string, error: any): void {
    this.logger.error(`${this.constructor.name}: ${operation} failed`, { error });
  }
}

/**
 * Service Error Classes
 */
export class ServiceError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string = 'SERVICE_ERROR', statusCode: number = 500) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ServiceError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ServiceError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string = 'Resource already exists') {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class ExternalServiceError extends ServiceError {
  constructor(service: string, message: string = 'External service error') {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502);
    this.name = 'ExternalServiceError';
  }
}

/**
 * Error handler utility
 */
export function handleServiceError(error: any): ServiceResponse<never> {
  if (error instanceof ServiceError) {
    return {
      success: false,
      message: error.message,
      error: error.code
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      message: error.message,
      error: 'UNKNOWN_ERROR'
    };
  }

  return {
    success: false,
    message: 'An unknown error occurred',
    error: 'UNKNOWN_ERROR'
  };
}
