
/**
 * Simplified Frontend Logging System for CutQ
 *
 * Matches backend logging approach with single logger and environment-based behavior
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata?: any;
  url?: string;
  userAgent?: string;
}

class SimpleFrontendLogger {
  private isDevelopment: boolean;
  private isProduction: boolean;
  private logLevel: LogLevel;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';

    // Set log level based on environment
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: string, message: string, metadata?: any): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
    };

    // Add browser context
    if (typeof window !== 'undefined') {
      entry.url = window.location.href;
      entry.userAgent = navigator.userAgent;
    }

    return entry;
  }

  private log(level: LogLevel, levelName: string, message: string, metadata?: any): void {
    if (!this.shouldLog(level)) return;

    const entry = this.formatMessage(levelName, message, metadata);

    // In development, use simple console output (like backend)
    if (this.isDevelopment) {
      const colors = {
        ERROR: '\x1b[31m', // Red
        WARN: '\x1b[33m',  // Yellow
        INFO: '\x1b[36m',  // Cyan
        DEBUG: '\x1b[90m', // Gray
      };
      const reset = '\x1b[0m';
      const color = colors[levelName as keyof typeof colors] || '';

      const formattedMessage = `${color}[${entry.timestamp}] ${levelName}${reset} ${message}`;

      switch (levelName) {
        case 'ERROR':
          console.error(formattedMessage, metadata || '');
          break;
        case 'WARN':
          console.warn(formattedMessage, metadata || '');
          break;
        case 'INFO':
          console.info(formattedMessage, metadata || '');
          break;
        case 'DEBUG':
          console.debug(formattedMessage, metadata || '');
          break;
        default:
          console.log(formattedMessage, metadata || '');
      }
    } else {
      // In production, send important logs to backend
      if (level <= LogLevel.WARN) {
        this.sendToBackend(entry);
      }
    }
  }

  private async sendToBackend(entry: LogEntry): Promise<void> {
    // Send logs to backend API in production (non-blocking)
    try {
      await fetch('/api/v1/frontend-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Silently fail - don't log errors about logging
    }
  }

  error(message: string, metadata?: any): void {
    this.log(LogLevel.ERROR, 'ERROR', message, metadata);
  }

  warn(message: string, metadata?: any): void {
    this.log(LogLevel.WARN, 'WARN', message, metadata);
  }

  info(message: string, metadata?: any): void {
    this.log(LogLevel.INFO, 'INFO', message, metadata);
  }

  debug(message: string, metadata?: any): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, metadata);
  }
}

// Create single logger instance (like backend)
export const logger = new SimpleFrontendLogger();

// Backward compatibility - all specialized loggers now point to the same instance
export const apiLogger = logger;
export const authLogger = logger;
export const uiLogger = logger;
export const analyticsLogger = logger;
export const serviceLogger = logger;
export const storeLogger = logger;
export const hookLogger = logger;
export const utilLogger = logger;
export const configLogger = logger;
export const componentLogger = logger;

// Default export
export default logger;
