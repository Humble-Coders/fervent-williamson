import * as admin from 'firebase-admin';
import { env } from './env';
import { logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

// Firebase Auth REST API response types
interface FirebaseVerificationResponse {
  sessionInfo?: string;
  error?: {
    code: number;
    message: string;
  };
}

interface FirebaseSignInResponse {
  localId?: string;
  idToken?: string;
  refreshToken?: string;
  error?: {
    code: number;
    message: string;
  };
}

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export const initializeFirebase = (): admin.app.App | null => {
  try {
    // Check if Firebase is already initialized
    if (firebaseApp) {
      return firebaseApp;
    }

    // Check if Firebase configuration is available
    if (!env.FIREBASE_PROJECT_ID) {
      logger.warn('Firebase configuration not found. Firebase SMS will not be available.');
      return null;
    }

    let serviceAccount: admin.ServiceAccount;

    // Try to load service account from file path first
    if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccountPath = path.resolve(env.FIREBASE_SERVICE_ACCOUNT_PATH);
      
      if (fs.existsSync(serviceAccountPath)) {
        logger.info('Loading Firebase service account from file:', serviceAccountPath);
        serviceAccount = require(serviceAccountPath);
      } else {
        logger.error('Firebase service account file not found:', serviceAccountPath);
        return null;
      }
    } 
    // Otherwise, try to construct from environment variables
    else if (env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL) {
      logger.info('Loading Firebase service account from environment variables');
      
      // Replace escaped newlines in private key
      const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      serviceAccount = {
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      };
    } else {
      logger.error('Firebase configuration incomplete. Please provide either FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL');
      return null;
    }

    // Initialize Firebase Admin SDK
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: env.FIREBASE_PROJECT_ID,
    });

    logger.info('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;

  } catch (error) {
    logger.error('❌ Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
};

/**
 * Get Firebase app instance
 */
export const getFirebaseApp = (): admin.app.App | null => {
  if (!firebaseApp) {
    return initializeFirebase();
  }
  return firebaseApp;
};

/**
 * Get Firebase Auth instance
 */
export const getFirebaseAuth = (): admin.auth.Auth | null => {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }
  return app.auth();
};

/**
 * Check if Firebase is configured and available
 */
export const isFirebaseAvailable = (): boolean => {
  return getFirebaseApp() !== null;
};

/**
 * Send SMS verification code using Firebase Auth
 */
export const sendFirebasePhoneVerification = async (phoneNumber: string): Promise<{
  success: boolean;
  message: string;
  verificationId?: string;
  error?: any;
}> => {
  try {
    const auth = getFirebaseAuth();
    if (!auth) {
      return {
        success: false,
        message: 'Firebase Auth is not available'
      };
    }

    // Clean phone number (ensure it starts with +)
    let cleanPhone = phoneNumber.replace(/\D/g, '');

    // Handle country code properly
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      // Already has country code, just add +
      cleanPhone = '+' + cleanPhone;
    } else if (cleanPhone.length === 10) {
      // No country code, add +91
      cleanPhone = '+91' + cleanPhone;
    } else if (!cleanPhone.startsWith('+')) {
      // Fallback: add +91 if no + prefix
      cleanPhone = '+91' + cleanPhone;
    }

    logger.info(`📱 Sending Firebase phone verification to: ${cleanPhone}`);

    // Create a custom token for phone verification
    // Note: This approach uses Firebase Admin SDK to create custom tokens
    // The actual SMS sending will be handled by Firebase Auth on the client side

    // For server-side phone verification, we need to use Firebase Auth REST API
    const response = await sendPhoneVerificationViaRestAPI(cleanPhone);

    return response;

  } catch (error) {
    logger.error('❌ Firebase phone verification error:', error);
    return {
      success: false,
      message: 'Failed to send Firebase phone verification',
      error
    };
  }
};

/**
 * Verify Firebase phone verification code
 */
export const verifyFirebasePhoneCode = async (verificationId: string, code: string): Promise<{
  success: boolean;
  message: string;
  uid?: string;
  error?: any;
}> => {
  try {
    const auth = getFirebaseAuth();
    if (!auth) {
      return {
        success: false,
        message: 'Firebase Auth is not available'
      };
    }

    logger.info(`📱 Verifying Firebase phone code: ${code} for verification ID: ${verificationId}`);

    // Verify the phone verification code using Firebase Auth REST API
    const response = await verifyPhoneCodeViaRestAPI(verificationId, code);

    return response;

  } catch (error) {
    logger.error('❌ Firebase phone verification error:', error);
    return {
      success: false,
      message: 'Failed to verify Firebase phone code',
      error
    };
  }
};

/**
 * Send phone verification using Firebase Auth REST API
 */
const sendPhoneVerificationViaRestAPI = async (phoneNumber: string): Promise<{
  success: boolean;
  message: string;
  verificationId?: string;
  error?: any;
}> => {
  try {
    // Get Firebase Web API Key from project config
    const webApiKey = await getFirebaseWebApiKey();
    if (!webApiKey) {
      return {
        success: false,
        message: 'Firebase Web API Key not found'
      };
    }

    // Firebase Auth REST API endpoint for sending verification code
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${webApiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber,
        recaptchaToken: 'bypass' // For testing, in production you'd need proper reCAPTCHA
      })
    });

    const data = await response.json() as FirebaseVerificationResponse;

    if (response.ok && data.sessionInfo) {
      logger.info(`✅ Firebase phone verification sent successfully to ${phoneNumber}`);
      return {
        success: true,
        message: 'Verification code sent successfully',
        verificationId: data.sessionInfo
      };
    } else {
      logger.error('❌ Firebase phone verification failed:', data);
      return {
        success: false,
        message: data.error?.message || 'Failed to send verification code',
        error: data.error
      };
    }

  } catch (error) {
    logger.error('❌ Firebase REST API error:', error);
    return {
      success: false,
      message: 'Failed to send verification code',
      error
    };
  }
};

/**
 * Verify phone code using Firebase Auth REST API
 */
const verifyPhoneCodeViaRestAPI = async (sessionInfo: string, code: string): Promise<{
  success: boolean;
  message: string;
  uid?: string;
  error?: any;
}> => {
  try {
    // Get Firebase Web API Key from project config
    const webApiKey = await getFirebaseWebApiKey();
    if (!webApiKey) {
      return {
        success: false,
        message: 'Firebase Web API Key not found'
      };
    }

    // Firebase Auth REST API endpoint for verifying code
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${webApiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionInfo: sessionInfo,
        code: code
      })
    });

    const data = await response.json() as FirebaseSignInResponse;

    if (response.ok && data.localId) {
      logger.info(`✅ Firebase phone verification successful for user: ${data.localId}`);
      return {
        success: true,
        message: 'Phone verification successful',
        uid: data.localId
      };
    } else {
      logger.error('❌ Firebase phone verification failed:', data);
      return {
        success: false,
        message: data.error?.message || 'Invalid verification code',
        error: data.error
      };
    }

  } catch (error) {
    logger.error('❌ Firebase REST API error:', error);
    return {
      success: false,
      message: 'Failed to verify code',
      error
    };
  }
};

/**
 * Get Firebase Web API Key from project configuration
 */
const getFirebaseWebApiKey = async (): Promise<string | null> => {
  try {
    // For now, we'll need to add this to environment variables
    // In a real implementation, you'd get this from Firebase project settings
    return env.FIREBASE_WEB_API_KEY || null;
  } catch (error) {
    logger.error('❌ Failed to get Firebase Web API Key:', error);
    return null;
  }
};
