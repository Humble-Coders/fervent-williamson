/**
 * Provider Configuration System
 * Centralized configuration for all external service providers
 */

export interface SMSProviderConfig {
  provider: 'fast2sms' | 'firebase' | 'twilio' | 'aws-sns' | 'bulksms';
  apiKey?: string;
  authToken?: string;
  accountSid?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  fromNumber?: string;
  username?: string;
  senderId?: string;
}

export interface EmailProviderConfig {
  provider: 'sendgrid' | 'aws-ses' | 'smtp' | 'outlook';
  apiKey?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  fromEmail?: string;
  fromName?: string;
}

export interface AuthProviderConfig {
  jwt: {
    secret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
  };
  social: {
    google?: {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
    facebook?: {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
    apple?: {
      clientId: string;
      teamId: string;
      keyId: string;
      privateKey: string;
      callbackUrl: string;
    };
  };
  firebase?: {
    projectId: string;
    privateKey: string;
    clientEmail: string;
  };
}

export interface DatabaseProviderConfig {
  provider: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb';
  url: string;
  ssl?: boolean;
  poolSize?: number;
}

export interface StorageProviderConfig {
  provider: 'local' | 'aws-s3' | 'gcp-storage' | 'azure-blob';
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  localPath?: string;
}

export interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    port: number;
    corsOrigins: string[];
    baseUrl: string;
  };
  database: DatabaseProviderConfig;
  auth: AuthProviderConfig;
  sms: SMSProviderConfig;
  email: EmailProviderConfig;
  storage: StorageProviderConfig;
  features: {
    emailVerification: boolean;
    smsVerification: boolean;
    socialAuth: boolean;
    fileUpload: boolean;
    rateLimiting: boolean;
  };
  business?: {
    // Optional business-specific configurations
    loyaltyProgram?: boolean;
    bookingSystem?: boolean;
    multiTenant?: boolean;
    [key: string]: any;
  };
}
