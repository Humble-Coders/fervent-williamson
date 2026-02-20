/**
 * Configuration Loader
 * Loads and validates configuration from environment variables
 */

import { env } from './env';
import { AppConfig, SMSProviderConfig, EmailProviderConfig, AuthProviderConfig, DatabaseProviderConfig, StorageProviderConfig } from './providers';

/**
 * Load SMS provider configuration
 */
function loadSMSConfig(): SMSProviderConfig {
  const provider = (env.SMS_PROVIDER || 'fast2sms') as SMSProviderConfig['provider'];

  const config: SMSProviderConfig = { provider };

  switch (provider) {
    case 'fast2sms':
      config.apiKey = env.FAST2SMS_API_KEY;
      break;
    case 'bulksms':
      config.username = env.BULKSMS_USERNAME;
      config.apiKey = env.BULKSMS_API_KEY;
      config.senderId = env.BULKSMS_SENDER_ID;
      break;
    case 'twilio':
      config.accountSid = env.TWILIO_ACCOUNT_SID;
      config.authToken = env.TWILIO_AUTH_TOKEN;
      config.fromNumber = env.TWILIO_FROM_NUMBER;
      break;
    case 'aws-sns':
      config.region = env.AWS_REGION;
      config.accessKeyId = env.AWS_ACCESS_KEY_ID;
      config.secretAccessKey = env.AWS_SECRET_ACCESS_KEY;
      break;
    case 'firebase':
      // Firebase config loaded from firebase.ts
      break;
  }

  return config;
}

/**
 * Load Email provider configuration
 */
function loadEmailConfig(): EmailProviderConfig {
  const provider = (env.EMAIL_PROVIDER || 'smtp') as EmailProviderConfig['provider'];
  
  const config: EmailProviderConfig = { 
    provider,
    fromEmail: env.SMTP_FROM_EMAIL || env.SMTP_USER,
    fromName: env.SMTP_FROM_NAME || env.APP_NAME || 'Application'
  };
  
  switch (provider) {
    case 'sendgrid':
      config.apiKey = env.SENDGRID_API_KEY;
      break;
    case 'aws-ses':
      config.region = env.AWS_REGION;
      config.accessKeyId = env.AWS_ACCESS_KEY_ID;
      config.secretAccessKey = env.AWS_SECRET_ACCESS_KEY;
      break;
    case 'smtp':
    case 'outlook':
      config.host = env.SMTP_HOST;
      config.port = env.SMTP_PORT || 587;
      config.secure = env.SMTP_SECURE === 'true';
      config.user = env.SMTP_USER;
      config.pass = env.SMTP_PASS;
      break;
  }
  
  return config;
}

/**
 * Load Authentication provider configuration
 */
function loadAuthConfig(): AuthProviderConfig {
  return {
    jwt: {
      secret: env.JWT_SECRET,
      accessTokenExpiry: env.JWT_ACCESS_EXPIRY || '15m',
      refreshTokenExpiry: env.JWT_REFRESH_EXPIRY || '7d'
    },
    social: {
      google: env.GOOGLE_CLIENT_ID ? {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackUrl: env.GOOGLE_CALLBACK_URL || `${env.BACKEND_URL}/auth/callback/google`
      } : undefined,
      facebook: env.FACEBOOK_CLIENT_ID ? {
        clientId: env.FACEBOOK_CLIENT_ID,
        clientSecret: env.FACEBOOK_CLIENT_SECRET,
        callbackUrl: env.FACEBOOK_CALLBACK_URL || `${env.BACKEND_URL}/auth/callback/facebook`
      } : undefined,
      apple: env.APPLE_CLIENT_ID ? {
        clientId: env.APPLE_CLIENT_ID,
        teamId: env.APPLE_TEAM_ID,
        keyId: env.APPLE_KEY_ID,
        privateKey: env.APPLE_PRIVATE_KEY,
        callbackUrl: env.APPLE_CALLBACK_URL || `${env.BACKEND_URL}/auth/callback/apple`
      } : undefined
    },
    firebase: env.FIREBASE_PROJECT_ID ? {
      projectId: env.FIREBASE_PROJECT_ID,
      privateKey: env.FIREBASE_PRIVATE_KEY,
      clientEmail: env.FIREBASE_CLIENT_EMAIL
    } : undefined
  };
}

/**
 * Load Database provider configuration
 */
function loadDatabaseConfig(): DatabaseProviderConfig {
  // Get the database URL from the dynamic configuration
  const databaseUrl = process.env.DATABASE_URL || '';

  return {
    provider: 'postgresql', // Default to PostgreSQL for now
    url: databaseUrl,
    ssl: env.DATABASE_SSL === 'true',
    poolSize: env.DATABASE_POOL_SIZE ? parseInt(env.DATABASE_POOL_SIZE) : 10
  };
}

/**
 * Load Storage provider configuration
 */
function loadStorageConfig(): StorageProviderConfig {
  const provider = (env.STORAGE_PROVIDER || 'local') as StorageProviderConfig['provider'];
  
  const config: StorageProviderConfig = { provider };
  
  switch (provider) {
    case 'aws-s3':
      config.bucket = env.AWS_S3_BUCKET;
      config.region = env.AWS_REGION;
      config.accessKeyId = env.AWS_ACCESS_KEY_ID;
      config.secretAccessKey = env.AWS_SECRET_ACCESS_KEY;
      break;
    case 'local':
      config.localPath = env.UPLOAD_PATH || './uploads';
      break;
  }
  
  return config;
}

/**
 * Load complete application configuration
 */
export function loadAppConfig(): AppConfig {
  return {
    app: {
      name: env.APP_NAME || 'Application',
      version: env.APP_VERSION || '1.0.0',
      environment: (env.NODE_ENV || 'development') as 'development' | 'staging' | 'production',
      port: env.PORT || 3000,
      corsOrigins: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
      baseUrl: env.BACKEND_URL || `http://localhost:${env.PORT || 3000}`
    },
    database: loadDatabaseConfig(),
    auth: loadAuthConfig(),
    sms: loadSMSConfig(),
    email: loadEmailConfig(),
    storage: loadStorageConfig(),
    features: {
      emailVerification: env.ENABLE_EMAIL_VERIFICATION !== 'false',
      smsVerification: env.ENABLE_SMS_VERIFICATION !== 'false',
      socialAuth: env.ENABLE_SOCIAL_AUTH !== 'false',
      fileUpload: env.ENABLE_FILE_UPLOAD !== 'false',
      rateLimiting: env.ENABLE_RATE_LIMITING !== 'false'
    },
    business: {
      loyaltyProgram: env.ENABLE_LOYALTY_PROGRAM === 'true',
      bookingSystem: env.ENABLE_BOOKING_SYSTEM === 'true',
      multiTenant: env.ENABLE_MULTI_TENANT === 'true'
    }
  };
}

// Export singleton instance
export const appConfig = loadAppConfig();
