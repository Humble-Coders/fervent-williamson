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
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR' || error.code === 'unavailable') {
      return ErrorType.NETWORK;
    }

    // Firebase Auth errors
    if (error.code?.startsWith('auth/')) {
      if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(error.code)) {
        return ErrorType.AUTHENTICATION;
      }
      if (error.code === 'auth/insufficient-permission') {
        return ErrorType.AUTHORIZATION;
      }
      return ErrorType.AUTHENTICATION;
    }

    // Firestore errors
    if (error.code === 'permission-denied') return ErrorType.AUTHORIZATION;
    if (error.code === 'not-found') return ErrorType.NOT_FOUND;
    if (error.code === 'already-exists') return ErrorType.CLIENT;

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
      code: error.code,
      details: {
        originalError: error.message,
        context,
      },
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      stack: error.stack,
    };
  }

  private extractErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
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
    const code = errorInfo.code;
    const technicalMessage = errorInfo.message;

    // Firebase error code mappings
    const firebaseMessageMap: Record<string, string> = {
      // Auth
      'auth/invalid-credential': 'Invalid email or password. Please try again.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      // Firestore
      'permission-denied': 'You do not have permission to perform this action.',
      'not-found': 'The requested item was not found.',
      'already-exists': 'This item already exists.',
      'unavailable': 'Service temporarily unavailable. Please try again.',
      // Storage
      'storage/unauthorized': 'You do not have permission to upload files.',
      'storage/object-not-found': 'File not found.',
    };

    if (code && firebaseMessageMap[code]) {
      return firebaseMessageMap[code];
    }

    // General message mapping
    const generalMap: Record<string, string> = {
      'Network Error': 'Unable to connect. Please check your internet connection.',
      'Validation failed': 'Please check your input and try again.',
    };

    return generalMap[technicalMessage] || technicalMessage || this.config.fallbackMessage!;
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
 * Extract user-friendly error message from a Firebase or generic error
 */
export const extractErrorMessage = (error: any): string => {
  logger.error('Extracting error message from:', error);

  // Firebase error codes
  const code = error.code;
  if (code) {
    const firebaseMessages: Record<string, string> = {
      'auth/invalid-credential': 'Invalid email or password',
      'auth/wrong-password': 'Incorrect password',
      'auth/user-not-found': 'No account found with this email',
      'auth/email-already-in-use': 'Email already exists',
      'auth/weak-password': 'Password is too weak',
      'auth/invalid-email': 'Invalid email address',
      'auth/too-many-requests': 'Too many attempts. Try again later',
      'permission-denied': 'Permission denied',
      'not-found': 'Item not found',
      'already-exists': 'Item already exists',
      'unavailable': 'Service temporarily unavailable',
    };
    if (firebaseMessages[code]) return firebaseMessages[code];
  }

  // Standard error message
  if (error.message) return error.message;

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
