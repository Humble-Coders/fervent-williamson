import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

// Rate limiting configuration
export const createRateLimiter = (windowMs?: number, max?: number) => {
  return rateLimit({
    windowMs: windowMs || env.RATE_LIMIT_WINDOW_MS,
    max: max || env.RATE_LIMIT_MAX_REQUESTS,
    message: {
      success: false,
      error: {
        message: 'Too many requests from this IP, please try again later.',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
      });
      
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests from this IP, please try again later.',
        },
      });
    },
  });
};

// CORS configuration
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    logger.warn('CORS blocked request', { origin });
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'ngrok-skip-browser-warning',
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400, // 24 hours
};

// Helmet configuration for security headers
export const helmetOptions = {
  contentSecurityPolicy: false, // Disable CSP for development to avoid image loading issues
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
};

// Compression configuration
export const compressionOptions = {
  filter: (req: any, res: any) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses larger than 1KB
};

// Security middleware setup function
export const setupSecurity = () => {
  return [
    helmet(helmetOptions),
    cors(corsOptions),
    compression(compressionOptions),
    createRateLimiter(),
  ];
};

// Request sanitization middleware
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Remove any potential XSS attempts from request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Remove any potential XSS attempts from query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

// Helper function to sanitize objects
const sanitizeObject = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const sanitized: any = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Basic XSS prevention - remove script tags and javascript: protocols
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '');
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
};
