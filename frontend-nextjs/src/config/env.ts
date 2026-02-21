/**
 * Environment configuration utility for Next.js
 * Centralizes all environment variable access and provides fallbacks
 */

interface EnvironmentConfig {
  GOOGLE_MAPS_API_KEY: string;
  NODE_ENV: string;
  DEV: boolean;
  PROD: boolean;
  // Brand Configuration
  BRAND_NAME: string;
  BRAND_PHONE: string;
  BRAND_ADDRESS: string;
  BRAND_EMAIL: string;
}

/**
 * Centralized environment configuration
 */
export const env: EnvironmentConfig = {
  // External service keys
  GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',

  // Brand Configuration
  BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME || 'CutQ',
  BRAND_PHONE: process.env.NEXT_PUBLIC_BRAND_PHONE || '+91 8197970532',
  BRAND_ADDRESS: process.env.NEXT_PUBLIC_BRAND_ADDRESS || 'New Delhi, IN 110001',
  BRAND_EMAIL: process.env.NEXT_PUBLIC_BRAND_EMAIL || 'contact@cutq.store',

  // Environment info
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEV: process.env.NODE_ENV === 'development',
  PROD: process.env.NODE_ENV === 'production',
};

/**
 * Helper function to check if we're in development
 */
export const isDevelopment = (): boolean => env.DEV;

/**
 * Helper function to check if we're in production
 */
export const isProduction = (): boolean => env.PROD;

export default env;
