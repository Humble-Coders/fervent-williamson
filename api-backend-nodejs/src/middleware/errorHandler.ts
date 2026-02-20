import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger } from '@/config/logger';
import { isDevelopment } from '@/config/env';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes for better error handling
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, false, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(message || `External service ${service} is unavailable`, 503, true, 'EXTERNAL_SERVICE_ERROR');
  }
}

export interface ErrorResponse {
  success: boolean;
  error: {
    message: string;
    code?: string;
    details?: any;
    stack?: string;
  };
}

const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  const meta = error.meta as any;

  switch (error.code) {
    case 'P2002':
      const field = meta?.target?.[0] || 'field';
      return new ConflictError(`${field} already exists`);
    case 'P2014':
      return new ValidationError('Invalid ID provided');
    case 'P2003':
      const foreignKey = meta?.field_name || 'reference';
      return new ValidationError(`Invalid ${foreignKey} reference`);
    case 'P2025':
      return new NotFoundError('Record');
    case 'P2016':
      return new ValidationError('Query interpretation error');
    case 'P2021':
      return new DatabaseError('Table does not exist');
    case 'P2022':
      return new DatabaseError('Column does not exist');
    default:
      return new DatabaseError('Database operation failed', { code: error.code, meta });
  }
};

const handlePrismaValidationError = (error: Prisma.PrismaClientValidationError): AppError => {
  return new ValidationError('Invalid data provided to database', { originalError: error.message });
};

const handleZodError = (error: ZodError): AppError => {
  const formattedErrors = error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
    received: (issue as any).received,
  }));

  const message = formattedErrors.map(err => `${err.field}: ${err.message}`).join(', ');
  return new ValidationError(`Validation failed: ${message}`, { errors: formattedErrors });
};

const handleJWTError = (error: Error): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid authentication token');
  } else if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Authentication token has expired');
  } else if (error.name === 'NotBeforeError') {
    return new AuthenticationError('Authentication token not active yet');
  }
  return new AuthenticationError('Authentication failed');
};

const handleMulterError = (error: any): AppError => {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return new ValidationError('File size too large');
    case 'LIMIT_FILE_COUNT':
      return new ValidationError('Too many files uploaded');
    case 'LIMIT_UNEXPECTED_FILE':
      return new ValidationError('Unexpected file field');
    default:
      return new ValidationError('File upload error');
  }
};

const sendErrorDev = (err: AppError, req: Request, res: Response): void => {
  const errorResponse = {
    success: false,
    error: {
      message: err.message,
      code: err.code || err.name,
      statusCode: err.statusCode,
      timestamp: err.timestamp,
      path: req.path,
      method: req.method,
      details: err.details,
      stack: err.stack,
    },
    request: {
      url: req.url,
      method: req.method,
      headers: req.headers,
      query: req.query,
      params: req.params,
      body: req.body,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
  };

  res.status(err.statusCode).json(errorResponse);
};

const sendErrorProd = (err: AppError, req: Request, res: Response): void => {
  // Only send operational errors to client in production
  if (err.isOperational) {
    const errorResponse = {
      success: false,
      error: {
        message: err.message,
        code: err.code,
        timestamp: err.timestamp,
        ...(err.details && { details: err.details }),
      },
    };

    res.status(err.statusCode).json(errorResponse);
  } else {
    // Log error and send generic message
    logger.error('Programming error', {
      error: err,
      request: {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });

    const errorResponse = {
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      },
    };

    res.status(500).json(errorResponse);
  }
};

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error: AppError;

  // Convert to AppError if not already
  if (err instanceof AppError) {
    error = err;
  } else {
    // Handle specific error types
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      error = handlePrismaError(err);
    } else if (err instanceof Prisma.PrismaClientValidationError) {
      error = handlePrismaValidationError(err);
    } else if (err instanceof ZodError) {
      error = handleZodError(err);
    } else if (err.name.includes('JWT') || err.name.includes('Token')) {
      error = handleJWTError(err);
    } else if (err.name === 'MulterError') {
      error = handleMulterError(err);
    } else if (err.name === 'CastError') {
      error = new ValidationError('Invalid ID format');
    } else if (err.name === 'SyntaxError' && 'body' in err) {
      error = new ValidationError('Invalid JSON in request body');
    } else if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
      error = new ExternalServiceError('External service', 'Service temporarily unavailable');
    } else {
      error = new AppError(err.message || 'Internal server error', 500, false);
    }
  }

  // Helper function to sanitize sensitive data from request body
  const sanitizeBody = (body: any): any => {
    if (!body) return body;
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'cvv', 'pin'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }
    return sanitized;
  };

  // Enhanced error logging with full context for production debugging
  const logData = {
    // Error details
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      stack: error.stack,
      details: error.details,
    },

    // Request context (CRITICAL for finding which customer had the issue)
    request: {
      id: req.headers['x-request-id'] || 'unknown',
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),

      // User identification - helps track which customer experienced the error
      userId: (req as any).user?.id,
      userEmail: (req as any).user?.email,
      userRole: (req as any).user?.role,

      // Request data - helps reproduce the bug
      query: req.query,
      params: req.params,
      body: sanitizeBody(req.body), // Don't log passwords

      timestamp: new Date().toISOString(),
    },

    // Original error (if transformed)
    originalError: err !== error ? {
      name: err.name,
      message: err.message,
      stack: err.stack,
    } : undefined,

    // Environment info - helps identify environment-specific issues
    environment: {
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
    },
  };

  // Log based on error severity
  if (error.statusCode >= 500) {
    logger.error('Server error occurred', logData);
  } else if (error.statusCode >= 400) {
    logger.warn('Client error occurred', logData);
  } else {
    logger.info('Error handled', logData);
  }

  // Send error response
  if (isDevelopment) {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

// Async error wrapper with enhanced error context
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error: Error) => {
      // Add request context to error
      if (error instanceof AppError) {
        (error as any).details = {
          ...error.details,
          requestId: req.headers['x-request-id'],
          userId: (req as any).user?.id,
        };
      }
      next(error);
    });
  };
};

// Error factory functions for common scenarios
export const createValidationError = (field: string, message: string, value?: any): ValidationError => {
  return new ValidationError(`${field}: ${message}`, { field, value });
};

export const createNotFoundError = (resource: string, id?: string): NotFoundError => {
  const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
  return new NotFoundError(message);
};

export const createConflictError = (resource: string, field: string, value: any): ConflictError => {
  return new ConflictError(`${resource} with ${field} '${value}' already exists`);
};

// Middleware to handle 404 errors for undefined routes
export const handleNotFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

// Middleware to handle unhandled promise rejections
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString(),
    });

    // Gracefully close the server
    process.exit(1);
  });
};

// Middleware to handle uncaught exceptions
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    });

    // Gracefully close the server
    process.exit(1);
  });
};

// Request timeout middleware
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        const error = new AppError('Request timeout', 408, true, 'REQUEST_TIMEOUT');
        next(error);
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

// Error boundary for critical sections
export const errorBoundary = (criticalSection: string) => {
  return (fn: Function) => {
    return async (...args: any[]) => {
      try {
        return await fn(...args);
      } catch (error) {
        logger.error(`Error in critical section: ${criticalSection}`, {
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
          } : error,
          section: criticalSection,
        });

        throw error instanceof AppError ? error : new AppError(
          `Critical error in ${criticalSection}`,
          500,
          false
        );
      }
    };
  };
};
