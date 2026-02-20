import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables in order of priority
// 1. .env.dev.local (highest priority for development)
// 2. .env.local
// 3. .env.development
// 4. .env (lowest priority)
const envFiles = [
  '.env',
  '.env.development',
  '.env.local',
  '.env.dev.local'
];

envFiles.forEach(file => {
  const filePath = path.resolve(process.cwd(), file);
  dotenv.config({ path: filePath, override: false });
});

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform((val) => parseInt(val, 10)),
  HOST: z.string().default('localhost'),

  // Database Configuration
  USE_REMOTE_DB: z.string().default('false').transform((val) => val.toLowerCase() === 'true'),
  LOCAL_DATABASE_URL: z.string().optional(),
  REMOTE_DATABASE_URL: z.string().optional(),
  DATABASE_SSL: z.string().optional(),
  DATABASE_POOL_SIZE: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform((val) => parseInt(val, 10)),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_TO_FILE: z.string().default('false'),
  LOG_TO_CONSOLE: z.string().default('true'),
  LOG_MAX_SIZE: z.string().default('20m'),
  LOG_MAX_FILES: z.string().default('14d'),
  LOG_MODULES: z.string().default('all'), // 'all' or comma-separated list like 'auth,booking,queue'
  LOG_EXCLUDE_MODULES: z.string().default(''), // comma-separated list of modules to exclude
  // Email Provider Configuration
  EMAIL_PROVIDER: z.enum(['smtp', 'sendgrid', 'aws-ses', 'outlook']).default('smtp'),

  // SMTP Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_NAME: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().optional(),
  SMTP_SECURE: z.string().optional(),

  // SendGrid Configuration
  SENDGRID_API_KEY: z.string().optional(),

  // SMS Provider Configuration
  SMS_PROVIDER: z.enum(['fast2sms', 'twilio', 'aws-sns', 'firebase', 'bulksms']).default('fast2sms'),

  // Fast2SMS Configuration
  FAST2SMS_API_KEY: z.string().default('z9LmVquXQOodcBSlnMDaw3E01Ryf5xb8geH6pTtAsjZkCY4NJUZrKhV2n5mqpjQoTNGABlPvJaUFw0Sf'),
  FAST2SMS_SENDER_ID: z.string().default('FSTSMS'),

  // BulkSMS Configuration
  BULKSMS_USERNAME: z.string().optional(),
  BULKSMS_API_KEY: z.string().optional(),
  BULKSMS_SENDER_ID: z.string().optional(),

  // Twilio Configuration
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  // AWS Configuration
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // Firebase Configuration
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  FIREBASE_WEB_API_KEY: z.string().optional(),
  MAX_FILE_SIZE: z.string().default('5242880').transform((val) => parseInt(val, 10)),
  UPLOAD_PATH: z.string().default('uploads/'),

  // Storage Provider Configuration
  STORAGE_PROVIDER: z.enum(['local', 'aws-s3']).default('local'),

  // Session Configuration
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),

  // Social Authentication Configuration
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CALLBACK_URL: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),

  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),
  APPLE_PRIVATE_KEY_PATH: z.string().optional(),
  APPLE_CALLBACK_URL: z.string().optional(),

  TWITTER_CONSUMER_KEY: z.string().optional(),
  TWITTER_CONSUMER_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // App Configuration
  APP_NAME: z.string().default('CutQ'),
  APP_VERSION: z.string().default('1.0.0'),
  BACKEND_URL: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Brand Configuration
  BRAND_NAME: z.string().default('CutQ'),
  BRAND_PHONE: z.string().default('+91 8197970532'),
  BRAND_ADDRESS: z.string().default('New Delhi, IN 110001'),
  BRAND_EMAIL: z.email().default('connect@cutq.store'),

  // Default CutQ Owner Configuration
  DEFAULT_SALON_OWNER_PASSWORD: z.string().default('cutq-owner-2024'),

  // Redis Configuration for Queue System
  USE_REMOTE_REDIS: z.string().default('false').transform((val) => val.toLowerCase() === 'true'),

  // Local Redis Configuration
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform((val) => parseInt(val, 10)),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0').transform((val) => parseInt(val, 10)),
  REDIS_URL: z.string().optional(),

  // Remote Redis Configuration
  REMOTE_REDIS_HOST: z.string().optional(),
  REMOTE_REDIS_PORT: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  REMOTE_REDIS_PASSWORD: z.string().optional(),
  REMOTE_REDIS_DB: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),

  // Razorpay Configuration
  RAZORPAY_KEY_ID: z.string().default('rzp_test_RTM0m3NrKIg8Dt'),
  RAZORPAY_KEY_SECRET: z.string().default('rzp_test_RTM0m3NrKIg8Dt'),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Payment Configuration
  PAYMENT_REQUIRED_FOR_BOOKING: z.string().default('true').transform((val) => val.toLowerCase() === 'true'),
  PAYMENT_TIMEOUT_MINUTES: z.string().default('15').transform((val) => parseInt(val, 10)),

  // Feature Flags
  ENABLE_EMAIL_VERIFICATION: z.string().default('true'),
  ENABLE_SMS_VERIFICATION: z.string().default('true'),
  ENABLE_SOCIAL_AUTH: z.string().default('true'),
  ENABLE_FILE_UPLOAD: z.string().default('true'),
  ENABLE_RATE_LIMITING: z.string().default('true'),
  ENABLE_LOYALTY_PROGRAM: z.string().default('false'),
  ENABLE_BOOKING_SYSTEM: z.string().default('true'),
  ENABLE_MULTI_TENANT: z.string().default('false'),
});

// Validate environment variables
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
