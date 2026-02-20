import { toast } from 'react-hot-toast';
import { logger } from '@/config/logger';

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  stack?: string;
}

export interface ErrorHandlerConfig {
  showToast?: boolean;
  logToConsole?: boolean;
  reportToService?: boolean;
  fallbackMessage?: string;
}

class ErrorHandler {
  private config: ErrorHandlerConfig = {
    showToast: true,
    logToConsole: true,
    reportToService: false,
    fallbackMessage: 'An unexpected error occurred. Please try again.',
  };

  private errorQueue: ErrorInfo[] = [];
  private maxQueueSize = 100;

  constructor(config?: Partial<ErrorHandlerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Set up global error handlers
    this.setupGlobalHandlers();
  }

  private setupGlobalHandlers(): void {
    // Only set up global handlers in browser environment
    if (typeof window === 'undefined') return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        type: ErrorType.UNKNOWN,
        context: 'unhandledrejection',
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error, {
        type: ErrorType.CLIENT,
        context: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Handle React error boundaries (if using)
    window.addEventListener('react-error', (event: any) => {
      this.handleError(event.detail.error, {
        type: ErrorType.CLIENT,
        context: 'react_error',
        componentStack: event.detail.componentStack,
      });
    });
  }

  private determineErrorType(error: any): ErrorType {
    if (!error) return ErrorType.UNKNOWN;

    // Network errors
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      return ErrorType.NETWORK;
    }

    // HTTP status code based classification
    if (error.response?.status) {
      const status = error.response.status;
      if (status === 401) return ErrorType.AUTHENTICATION;
      if (status === 403) return ErrorType.AUTHORIZATION;
      if (status === 404) return ErrorType.NOT_FOUND;
      if (status >= 400 && status < 500) return ErrorType.CLIENT;
      if (status >= 500) return ErrorType.SERVER;
    }

    // Validation errors
    if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
      return ErrorType.VALIDATION;
    }

    // Default to unknown
    return ErrorType.UNKNOWN;
  }

  private createErrorInfo(error: any, context?: any): ErrorInfo {
    const errorType = this.determineErrorType(error);
    
    return {
      type: errorType,
      message: this.extractErrorMessage(error),
      code: error.code || error.response?.data?.code,
      details: {
        originalError: error.message,
        response: error.response?.data,
        status: error.response?.status,
        context,
      },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      stack: error.stack,
    };
  }

  private extractErrorMessage(error: any): string {
    // Try different ways to extract a meaningful error message
    if (typeof error === 'string') return error;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.data?.error) return error.response.data.error;
    if (error.message) return error.message;
    if (error.statusText) return error.statusText;
    
    return this.config.fallbackMessage!;
  }

  private getCurrentUserId(): string | undefined {
    // Try to get user ID from various sources
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string | undefined {
    // Try to get session ID from storage or generate one
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private addToQueue(errorInfo: ErrorInfo): void {
    this.errorQueue.push(errorInfo);
    
    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  private showUserNotification(errorInfo: ErrorInfo): void {
    if (!this.config.showToast) return;

    const message = this.getUserFriendlyMessage(errorInfo);

    // Always use the contextual user-friendly message
    switch (errorInfo.type) {
      case ErrorType.NETWORK:
        toast.error(message || 'Network error. Please check your connection.');
        break;
      case ErrorType.AUTHENTICATION:
        toast.error(message || 'Please log in to continue.');
        break;
      case ErrorType.AUTHORIZATION:
        toast.error(message || 'You do not have permission to perform this action.');
        break;
      case ErrorType.NOT_FOUND:
        toast.error(message || 'The requested item was not found.');
        break;
      case ErrorType.VALIDATION:
        toast.error(message || 'Please check your input and try again.');
        break;
      case ErrorType.SERVER:
        toast.error(message || 'Server error. Please try again later.');
        break;
      default:
        toast.error(message || this.config.fallbackMessage!);
    }
  }

  private getUserFriendlyMessage(errorInfo: ErrorInfo): string {
    // Return user-friendly messages based on error type and context
    const technicalMessage = errorInfo.message;
    const status = errorInfo.details?.status;
    const url = errorInfo.url || '';

    // Context-aware user-friendly messages
    const getContextualMessage = (status: number, url: string): string => {
      if (status === 404) {
        if (url.includes('/salons/')) return 'Salon not found. It may have been removed or the link is incorrect.';
        if (url.includes('/services/')) return 'Service not found. It may have been removed or is no longer available.';
        if (url.includes('/stylists/')) return 'Stylist not found. They may no longer be available.';
        if (url.includes('/bookings/')) return 'Booking not found. It may have been cancelled or completed.';
        if (url.includes('/users/')) return 'User not found. The account may have been deactivated.';
        return 'The requested item was not found.';
      }

      if (status === 401) {
        return 'Your session has expired. Please log in again.';
      }

      if (status === 403) {
        if (url.includes('/admin/')) return 'You do not have admin privileges to access this feature.';
        return 'You do not have permission to perform this action.';
      }

      if (status === 400) {
        if (url.includes('/upload/')) return 'File upload failed. Please check the file format and size.';
        if (url.includes('/bookings/')) return 'Booking request is invalid. Please check your selection and try again.';
        return 'Invalid request. Please check your input and try again.';
      }

      if (status === 409) {
        if (url.includes('/bookings/')) return 'This time slot is no longer available. Please choose another time.';
        if (url.includes('/users/')) return 'An account with this email already exists.';
        return 'This action conflicts with existing data. Please refresh and try again.';
      }

      if (status === 422) {
        return 'Please check your input and correct any errors.';
      }

      if (status >= 500) {
        return 'Our servers are experiencing issues. Please try again in a few moments.';
      }

      return '';
    };

    // Map technical messages to user-friendly ones
    const messageMap: Record<string, string> = {
      'Network Error': 'Unable to connect to the server. Please check your internet connection.',
      'Request timeout': 'The request is taking too long. Please try again.',
      'Invalid token': 'Your session has expired. Please log in again.',
      'Validation failed': 'Please check your input and try again.',
      'Request failed with status code 404': 'The requested item was not found.',
      'Request failed with status code 401': 'Your session has expired. Please log in again.',
      'Request failed with status code 403': 'You do not have permission to perform this action.',
      'Request failed with status code 400': 'Invalid request. Please check your input and try again.',
      'Request failed with status code 500': 'Our servers are experiencing issues. Please try again in a few moments.',
      'Request failed with status code 502': 'Service temporarily unavailable. Please try again later.',
      'Request failed with status code 503': 'Service temporarily unavailable. Please try again later.',
    };

    // Try contextual message first
    if (status) {
      const contextualMessage = getContextualMessage(status, url);
      if (contextualMessage) return contextualMessage;
    }

    // Fall back to technical message mapping
    return messageMap[technicalMessage] || technicalMessage || this.config.fallbackMessage!;
  }

  private logError(errorInfo: ErrorInfo): void {
    if (!this.config.logToConsole) return;

    logger.error(`🚨 Error [${errorInfo.type}]`, {
      message: errorInfo.message,
      code: errorInfo.code,
      details: errorInfo.details,
      timestamp: errorInfo.timestamp,
      url: errorInfo.url,
      stack: errorInfo.stack
    });
  }

  private async reportError(errorInfo: ErrorInfo): Promise<void> {
    if (!this.config.reportToService) return;

    try {
      // Send error to monitoring service (e.g., Sentry, LogRocket, etc.)
      await fetch('/api/v1/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorInfo),
      });
    } catch (reportingError) {
      logger.warn('Failed to report error to monitoring service:', reportingError);
    }
  }

  public handleError(error: any, context?: any): void {
    const errorInfo = this.createErrorInfo(error, context);
    
    // Add to queue for potential batch reporting
    this.addToQueue(errorInfo);
    
    // Log error
    this.logError(errorInfo);
    
    // Show user notification
    this.showUserNotification(errorInfo);
    
    // Report to monitoring service
    this.reportError(errorInfo);
  }

  public handleApiError(error: any): void {
    this.handleError(error, { source: 'api' });
  }

  public handleValidationError(errors: Record<string, string[]>): void {
    const message = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ');
    
    this.handleError(new Error(message), { 
      type: ErrorType.VALIDATION,
      source: 'validation',
      errors 
    });
  }

  public getErrorHistory(): ErrorInfo[] {
    return [...this.errorQueue];
  }

  public clearErrorHistory(): void {
    this.errorQueue = [];
  }

  public updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Create and export singleton instance
export const errorHandler = new ErrorHandler();

// Utility functions for common error scenarios
export const handleApiError = (error: any) => errorHandler.handleApiError(error);
export const handleValidationError = (errors: Record<string, string[]>) => errorHandler.handleValidationError(errors);

/**
 * Extract user-friendly error message from API error response
 */
export const extractErrorMessage = (error: any): string => {
  logger.error('Extracting error message from:', error);

  const status = error.response?.status;
  const url = error.config?.url || '';

  // Handle validation errors first (before generic status codes)
  if (error.response?.data?.errors) {
    const validationErrors = error.response.data.errors;
    const errorMessages = validationErrors.map((err: any) => {
      if (err.message) {
        return err.message;
      }
      if (err.path && err.path.length > 0) {
        const field = err.path[0];
        const message = err.message || `${field} is invalid`;
        return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${message}`;
      }
      return err.message || 'Validation error';
    }).join('\n');

    return errorMessages;
  }

  // Handle general API error messages (prefer these over generic status messages)
  if (error.response?.data?.message) {
    const apiMessage = error.response.data.message;
    // Don't return technical messages like "Request failed with status code 404"
    if (apiMessage.includes('Request failed with status code')) {
      return status ? `Error ${status}` : 'Request failed';
    }
    return apiMessage;
  }

  // Handle specific HTTP status codes with context-aware messages
  if (status === 404) {
    if (url.includes('/salons/')) return 'Salon not found';
    if (url.includes('/services/')) return 'Service not found';
    if (url.includes('/stylists/')) return 'Stylist not found';
    if (url.includes('/bookings/')) return 'Booking not found';
    if (url.includes('/users/')) return 'User not found';
    return 'Item not found';
  }

  if (status === 401) {
    return 'Session expired. Please log in again';
  }

  if (status === 403) {
    if (url.includes('/admin/')) return 'Admin access required';
    return 'Permission denied';
  }

  if (status === 400) {
    if (url.includes('/upload/')) return 'File upload failed';
    if (url.includes('/bookings/')) return 'Invalid booking request';
    return 'Invalid request';
  }

  if (status === 409) {
    if (url.includes('/bookings/')) return 'Time slot no longer available';
    if (url.includes('/users/')) return 'Email already exists';
    return 'Conflict with existing data';
  }

  if (status === 422) {
    return 'Please check your input';
  }

  if (status >= 500) {
    return 'Server error. Please try again later';
  }



  // Handle axios error messages
  if (error.message) {
    const message = error.message;
    // Don't return technical messages
    if (message.includes('Request failed with status code')) {
      return status ? `Error ${status}` : 'Request failed';
    }
    return message;
  }

  // Fallback
  return 'An unexpected error occurred';
};
export const handleNetworkError = () => errorHandler.handleError(new Error('Network Error'), { type: ErrorType.NETWORK });

// React hook for error handling
export const useErrorHandler = () => {
  return {
    handleError: errorHandler.handleError.bind(errorHandler),
    handleApiError: errorHandler.handleApiError.bind(errorHandler),
    handleValidationError: errorHandler.handleValidationError.bind(errorHandler),
    getErrorHistory: errorHandler.getErrorHistory.bind(errorHandler),
    clearErrorHistory: errorHandler.clearErrorHistory.bind(errorHandler),
  };
};

export default errorHandler;
