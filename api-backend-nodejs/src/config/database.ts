import { PrismaClient } from '@prisma/client';
import { env, isDevelopment } from './env';
import { logger } from './logger';

export interface DatabaseConfig {
  url: string;
  ssl?: boolean;
  poolSize?: number;
}

/**
 * Get Database configuration from environment variables
 * Uses flag-based system to switch between local and remote database
 */
export const getDatabaseConfig = (): DatabaseConfig => {
  let databaseUrl: string;

  // Check if we should use remote database
  if (env.USE_REMOTE_DB) {
    console.log('🌐 Using remote database configuration');

    // Validate remote database configuration
    if (!env.REMOTE_DATABASE_URL) {
      throw new Error('REMOTE_DATABASE_URL is required when USE_REMOTE_DB=true');
    }

    databaseUrl = env.REMOTE_DATABASE_URL;
  } else {
    console.log('🏠 Using local database configuration');

    // Use LOCAL_DATABASE_URL if available, otherwise fall back to DATABASE_URL
    if (!env.LOCAL_DATABASE_URL) {
      throw new Error('LOCAL_DATABASE_URL is required when USE_REMOTE_DB=false');
    }

    databaseUrl = env.LOCAL_DATABASE_URL;
  }

  // Set DATABASE_URL environment variable for Prisma
  process.env.DATABASE_URL = databaseUrl;

  return {
    url: databaseUrl,
    ssl: env.DATABASE_SSL === 'true',
    poolSize: env.DATABASE_POOL_SIZE ? parseInt(env.DATABASE_POOL_SIZE) : 10,
  };
};

/**
 * Get current database configuration info for debugging
 */
export const getDatabaseInfo = (): string => {
  const config = getDatabaseConfig();
  const dbType = env.USE_REMOTE_DB ? 'Remote' : 'Local';

  // Parse URL to get host info without exposing credentials
  try {
    const url = new URL(config.url);
    return `${dbType} Database: ${url.hostname}:${url.port}/${url.pathname.slice(1)}`;
  } catch (error) {
    return `${dbType} Database: [URL parsing failed]`;
  }
};

// Initialize database configuration (sets DATABASE_URL environment variable)
getDatabaseConfig();

// Extend PrismaClient with custom configuration
const prisma = new PrismaClient({
  log: isDevelopment
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
  errorFormat: 'pretty',
});

// Note: Event handlers temporarily disabled due to TypeScript issues
// Will be re-enabled after Prisma client types are properly configured

// Database connection function
export const connectDatabase = async (): Promise<void> => {
  try {
    const dbType = env.USE_REMOTE_DB ? 'Remote' : 'Local';
    console.log(`🔍 Testing ${dbType} database connection...`);
    console.log(`📊 Database Configuration: ${getDatabaseInfo()}`);

    await prisma.$connect();
    logger.info(`✅ ${dbType} database connected successfully`);
  } catch (error) {
    const dbType = env.USE_REMOTE_DB ? 'Remote' : 'Local';
    logger.error(`❌ ${dbType} database connection failed`, error);
    process.exit(1);
  }
};

// Database disconnection function
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting from database', error);
  }
};

// Health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed', error);
    return false;
  }
};

/**
 * Test database connection and display configuration info
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const config = getDatabaseConfig();
    const dbType = env.USE_REMOTE_DB ? 'Remote' : 'Local';

    console.log(`🔍 Testing ${dbType} database connection...`);

    // Parse URL to show connection details without exposing credentials
    try {
      const url = new URL(config.url);
      console.log(`📍 Host: ${url.hostname}:${url.port}`);
      console.log(`🗄️ Database: ${url.pathname.slice(1)}`);
      console.log(`👤 User: ${url.username}`);
      console.log(`🔐 Password: ${url.password ? '***' : 'None'}`);
    } catch (urlError) {
      console.log(`📍 URL: [URL parsing failed]`);
    }

    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    await prisma.$disconnect();

    console.log(`✅ ${dbType} database connection test successful`);
    return true;
  } catch (error) {
    const dbType = env.USE_REMOTE_DB ? 'Remote' : 'Local';
    console.error(`❌ ${dbType} database connection test failed:`, error);
    return false;
  }
};

export { prisma };
export default prisma;
