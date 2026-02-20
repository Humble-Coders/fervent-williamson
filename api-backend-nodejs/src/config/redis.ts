/**
 * Redis Configuration
 * Centralized Redis connection configuration for Bull Queue
 */

import { createClient } from 'redis';
import { env } from './env';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  url?: string;
}

/**
 * Get Redis configuration from environment variables
 * Uses flag-based system to switch between local and remote Redis
 */
export const getRedisConfig = (): RedisConfig => {
  // Check if we should use remote Redis
  if (env.USE_REMOTE_REDIS) {
    console.log('🌐 Using remote Redis configuration');

    // Validate remote Redis configuration
    if (!env.REMOTE_REDIS_HOST) {
      throw new Error('REMOTE_REDIS_HOST is required when USE_REMOTE_REDIS=true');
    }

    return {
      host: env.REMOTE_REDIS_HOST,
      port: env.REMOTE_REDIS_PORT || 6379,
      password: env.REMOTE_REDIS_PASSWORD,
      db: env.REMOTE_REDIS_DB || 0,
      url: env.REDIS_URL, // Still allow URL override if provided
    };
  } else {
    console.log('🏠 Using local Redis configuration');

    return {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      db: env.REDIS_DB,
      url: env.REDIS_URL,
    };
  }
};

/**
 * Create Redis connection options for Bull Queue
 */
export const getBullRedisConfig = () => {
  const config = getRedisConfig();
  
  // If Redis URL is provided, use it
  if (config.url) {
    return config.url;
  }
  
  // Otherwise, use individual config options
  return {
    host: config.host,
    port: config.port,
    password: config.password,
    db: config.db,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  };
};

/**
 * Create a Redis client instance
 */
export const createRedisClient = async () => {
  const config = getRedisConfig();
  
  let client;
  
  if (config.url) {
    client = createClient({ url: config.url });
  } else {
    client = createClient({
      socket: {
        host: config.host,
        port: config.port,
      },
      password: config.password,
      database: config.db,
    });
  }
  
  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });
  
  client.on('connect', () => {
    console.log('✅ Redis client connected');
  });
  
  client.on('ready', () => {
    console.log('✅ Redis client ready');
  });
  
  client.on('end', () => {
    console.log('❌ Redis client disconnected');
  });
  
  await client.connect();
  return client;
};

/**
 * Test Redis connection and display configuration info
 */
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    const config = getRedisConfig();
    const redisType = env.USE_REMOTE_REDIS ? 'Remote' : 'Local';

    console.log(`🔍 Testing ${redisType} Redis connection...`);
    console.log(`📍 Host: ${config.host}:${config.port}`);
    console.log(`🗄️ Database: ${config.db}`);
    console.log(`🔐 Password: ${config.password ? '***' : 'None'}`);

    const client = await createRedisClient();
    const pong = await client.ping();
    await client.quit();

    console.log(`✅ ${redisType} Redis connection test successful - Response: ${pong}`);
    return true;
  } catch (error) {
    const redisType = env.USE_REMOTE_REDIS ? 'Remote' : 'Local';
    console.error(`❌ ${redisType} Redis connection test failed:`, error);
    return false;
  }
};

/**
 * Get current Redis configuration info for debugging
 */
export const getRedisInfo = (): string => {
  const config = getRedisConfig();
  const redisType = env.USE_REMOTE_REDIS ? 'Remote' : 'Local';

  return `${redisType} Redis: ${config.host}:${config.port} (DB: ${config.db})`;
};
