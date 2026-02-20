import { env, isDevelopment } from './env';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Module filtering configuration
const getEnabledModules = (): Set<string> => {
  const logModules = env.LOG_MODULES || 'all';
  if (logModules === 'all') {
    return new Set(['all']);
  }
  return new Set(logModules.split(',').map((m: string) => m.trim().toLowerCase()));
};

const getDisabledModules = (): Set<string> => {
  const excludeModules = env.LOG_EXCLUDE_MODULES || '';
  if (!excludeModules) {
    return new Set();
  }
  return new Set(excludeModules.split(',').map((m: string) => m.trim().toLowerCase()));
};

const enabledModules = getEnabledModules();
const disabledModules = getDisabledModules();

const isModuleEnabled = (module?: string): boolean => {
  if (!module) return true;

  const moduleKey = module.toLowerCase();

  // Check if module is explicitly disabled
  if (disabledModules.has(moduleKey)) {
    return false;
  }

  // If 'all' is enabled, allow all modules (except disabled ones)
  if (enabledModules.has('all')) {
    return true;
  }

  // Check if module is explicitly enabled
  return enabledModules.has(moduleKey);
};

export interface Logger {
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
  audit(action: string, meta?: any): void;
  security(event: string, meta?: any): void;
  performance(metric: string, value: number, meta?: any): void;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  AUDIT = 4,
  SECURITY = 5,
  PERFORMANCE = 6,
}

// Winston log levels configuration
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  audit: 4,
  security: 5,
  performance: 6,
};

// Winston colors configuration
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  audit: 'magenta',
  security: 'red bold',
  performance: 'cyan',
};

winston.addColors(logColors);

// Determine log level based on environment
const getLogLevel = (): string => {
  const nodeEnv = env.NODE_ENV || 'development';

  if (nodeEnv === 'production') {
    return env.LOG_LEVEL || 'info'; // Info, warnings and errors in production
  } else if (nodeEnv === 'test') {
    return 'error'; // Only errors in test
  } else {
    return env.LOG_LEVEL || 'debug'; // All logs in development
  }
};

// Create logs directory path
const logsDir = path.join(process.cwd(), 'logs');

// Define log format with enhanced metadata
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ` ${JSON.stringify(meta)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// File transports with daily rotation for production-grade logging
transports.push(
  // Error logs - Keep for 30 days (critical for debugging)
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: logFormat,
    maxSize: '20m',        // Rotate if file exceeds 20MB
    maxFiles: '30d',       // Keep error logs for 30 days
    zippedArchive: true,   // Compress old logs to save space
  }),

  // Warning logs - Keep for 14 days
  new DailyRotateFile({
    filename: path.join(logsDir, 'warn-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'warn',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d',       // Keep warnings for 14 days
    zippedArchive: true,
  }),

  // Info logs - Keep for 7 days
  new DailyRotateFile({
    filename: path.join(logsDir, 'info-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '7d',        // Keep info logs for 7 days
    zippedArchive: true,
  }),

  // Debug logs - Keep for 3 days
  new DailyRotateFile({
    filename: path.join(logsDir, 'debug-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'debug',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '3d',        // Keep debug logs for 3 days
    zippedArchive: true,
  }),

  // Audit logs - Keep for 90 days (compliance)
  new DailyRotateFile({
    filename: path.join(logsDir, 'audit-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'audit',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '90d',       // Keep audit logs for 90 days
    zippedArchive: true,
  }),

  // Security logs - Keep for 90 days (compliance)
  new DailyRotateFile({
    filename: path.join(logsDir, 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'security',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '90d',       // Keep security logs for 90 days
    zippedArchive: true,
  }),

  // Performance logs - Keep for 7 days
  new DailyRotateFile({
    filename: path.join(logsDir, 'performance-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'performance',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '7d',        // Keep performance logs for 7 days
    zippedArchive: true,
  }),

  // Combined logs (all levels) - Keep for 14 days
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: '50m',        // Larger size for combined logs
    maxFiles: '14d',       // Keep combined for 14 days
    zippedArchive: true,
  })
);

// Add console transport for development
if (isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: getLogLevel(),
    })
  );
}

// Create Winston logger instance
const winstonLogger = winston.createLogger({
  level: getLogLevel(),
  levels: logLevels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Wrapper class to maintain existing API and add module filtering
class EnhancedLogger implements Logger {
  private shouldLogModule(meta?: any): boolean {
    if (!meta?.module) return true;
    return isModuleEnabled(meta.module);
  }

  error(message: string, meta?: any): void {
    if (!this.shouldLogModule(meta)) return;
    winstonLogger.error(message, meta);
  }

  warn(message: string, meta?: any): void {
    if (!this.shouldLogModule(meta)) return;
    winstonLogger.warn(message, meta);
  }

  info(message: string, meta?: any): void {
    if (!this.shouldLogModule(meta)) return;
    winstonLogger.info(message, meta);
  }

  debug(message: string, meta?: any): void {
    if (!this.shouldLogModule(meta)) return;
    winstonLogger.debug(message, meta);
  }

  audit(action: string, meta?: any): void {
    if (!this.shouldLogModule(meta)) return;
    winstonLogger.log('audit', `AUDIT: ${action}`, meta);
  }

  security(event: string, meta?: any): void {
    if (!this.shouldLogModule(meta)) return;
    winstonLogger.log('security', `SECURITY: ${event}`, meta);
  }

  performance(metric: string, value: number, meta?: any): void {
    if (!this.shouldLogModule(meta)) return;
    winstonLogger.log('performance', `PERFORMANCE: ${metric} = ${value}ms`, { ...meta, metric, value });
  }
}

export const logger: Logger = new EnhancedLogger();

// Enhanced request logging middleware
export const requestLogger = (req: any, res: any, next: any): void => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add request ID to request object
  req.requestId = requestId;

  // Log incoming request
  logger.info(`Incoming request: ${req.method} ${req.url}`, {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    query: req.query,
    params: req.params,
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url, ip } = req;
    const { statusCode } = res;

    const logData = {
      requestId,
      method,
      url,
      statusCode,
      duration,
      ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      responseSize: res.get('Content-Length'),
    };

    if (statusCode >= 500) {
      logger.error(`Request failed: ${method} ${url}`, logData);
    } else if (statusCode >= 400) {
      logger.warn(`Client error: ${method} ${url}`, logData);
    } else {
      logger.info(`Request completed: ${method} ${url}`, logData);
    }

    // Log performance metrics for slow requests
    if (duration > 1000) {
      logger.performance(`Slow request: ${method} ${url}`, duration, logData);
    }
  });

  next();
};

// Security event logging
export const logSecurityEvent = (event: string, req: any, meta?: any): void => {
  logger.security(event, {
    module: 'security',
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

// Audit logging for important actions
export const logAuditEvent = (action: string, req: any, meta?: any): void => {
  logger.audit(action, {
    module: 'audit',
    requestId: req.requestId,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

// Database query logging
export const logDatabaseQuery = (query: string, duration: number, meta?: any): void => {
  if (duration > 100) { // Log slow queries
    logger.performance(`Slow database query`, duration, {
      module: 'database',
      query: query.substring(0, 200), // Truncate long queries
      duration,
      ...meta,
    });
  } else if (isDevelopment) {
    logger.debug(`Database query executed`, {
      module: 'database',
      query: query.substring(0, 200),
      duration,
      ...meta,
    });
  }
};

// Error logging helper
export const logError = (error: Error, context?: any, module?: string): void => {
  logger.error('Application error', {
    module: module || 'app',
    message: error.message,
    stack: error.stack,
    context,
  });
};

// OTP operation logging
export const logOTPOperation = (operation: string, meta?: any): void => {
  logger.info(`OTP operation: ${operation}`, {
    module: 'otp',
    operation,
    ...meta,
  });
};

// Note: Log rotation is now handled automatically by winston-daily-rotate-file
// No need for manual rotation or setInterval
