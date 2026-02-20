// Configuration barrel exports
export { env, isDevelopment, isProduction, isTest } from './env';
export { prisma } from './database';
export { logger } from './logger';
export { default as passport } from './passport';

// Re-export configuration types
export type {
  DatabaseConfig,
  JwtConfig,
  ServerConfig,
  CorsConfig,
  RateLimitConfig,
} from '../types';
