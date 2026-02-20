/**
 * Environment configuration utility for Next.js
 * Centralizes all environment variable access and provides fallbacks
 */

interface EnvironmentConfig {
  API_URL: string;
  API_BASE_URL: string;
  BACKEND_BASE_URL: string;
  GOOGLE_MAPS_API_KEY: string;
  STRIPE_PUBLIC_KEY: string;
  RAZORPAY_KEY_ID: string;
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
 * Detect if running in mobile emulator/simulator
 */
const isRunningInEmulator = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check for Capacitor (mobile app wrapper)
  return !!(window as any).capacitor || !!(window as any).Capacitor;
};

/**
 * Get the API base URL from environment variables
 */
const getApiBaseUrl = (): string => {
  // Check Next.js environment variable first
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Check if we're running in a mobile emulator
  if (typeof window !== 'undefined' && isRunningInEmulator()) {
    // Detect if it's Android emulator or iOS simulator
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = userAgent.includes('android');

    if (isAndroid) {
      // Android emulator: use 10.0.2.2 to reach host machine
      console.log('📱 Android Emulator detected - using 10.0.2.2');
      return 'http://10.0.2.2:5001/api/v1';
    } else {
      // iOS simulator: use localhost
      console.log('📱 iOS Simulator detected - using localhost');
      return 'http://localhost:5001/api/v1';
    }
  }

  // Check if we're on ngrok (for development/testing)
  if (typeof window !== 'undefined' && window.location.hostname.includes('ngrok-free.app')) {
    // In production ngrok, you should set NEXT_PUBLIC_API_URL properly
    console.warn('⚠️ Running on ngrok but NEXT_PUBLIC_API_URL not set. Please configure your environment variables.');
    return 'https://YOUR_BACKEND_NGROK_URL.ngrok-free.app/api/v1';
  }

  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3002/api/v1';
  }

  // Production fallback - this should never be used in production
  console.error('❌ No API URL configured! Please set NEXT_PUBLIC_API_URL environment variable.');
  return '/api/v1'; // Relative URL for production
};

/**
 * Get the backend base URL (without /api/v1) for static file serving
 */
const getBackendBaseUrl = (): string => {
  const apiUrl = getApiBaseUrl();

  // Remove /api/v1 suffix to get the base backend URL
  if (apiUrl.endsWith('/api/v1')) {
    return apiUrl.replace('/api/v1', '');
  }

  return apiUrl;
};

/**
 * Centralized environment configuration
 */
export const env: EnvironmentConfig = {
  // API URLs
  API_URL: getApiBaseUrl(),
  API_BASE_URL: getApiBaseUrl(),
  BACKEND_BASE_URL: getBackendBaseUrl(),

  // External service keys
  GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
  RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_RTM0m3NrKIg8Dt',

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
 * Validate that required environment variables are set
 */
export const validateEnvironment = (): void => {
  const requiredVars = [
    { key: 'API_URL', value: env.API_URL },
  ];

  const missing = requiredVars.filter(({ value }) => !value);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(({ key }) => {
      console.error(`   - NEXT_PUBLIC_${key}`);
    });

    if (env.PROD) {
      throw new Error('Missing required environment variables in production');
    }
  }

  // Log configuration in development (but not in tests)
  if (env.DEV && env.NODE_ENV !== 'test') {
    console.log('🔧 Environment Configuration:');
    console.log(`   API URL: ${env.API_URL}`);
    console.log(`   Backend URL: ${env.BACKEND_BASE_URL}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
  }
};

/**
 * Helper function to build API URLs
 */
export const buildApiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${env.API_URL}/${cleanPath}`;
};

/**
 * Helper function to build backend URLs (for static files)
 */
export const buildBackendUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${env.BACKEND_BASE_URL}/${cleanPath}`;
};

/**
 * Helper function to check if we're in development
 */
export const isDevelopment = (): boolean => env.DEV;

/**
 * Helper function to check if we're in production
 */
export const isProduction = (): boolean => env.PROD;

// Validate environment on module load (only on client side)
if (typeof window !== 'undefined') {
  validateEnvironment();
}

export default env;
