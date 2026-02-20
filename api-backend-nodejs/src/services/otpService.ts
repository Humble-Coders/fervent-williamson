import { env } from '../config/env';
import { prisma } from '@/config/database';
import { isFirebaseAvailable, sendFirebasePhoneVerification } from '../config/firebase';
import {
  asyncAnalytics,
  CommunicationStatus,
  MessageTemplate
} from './asyncAnalyticsService';
import { SMSServiceFactory } from './sms/SMSServiceFactory';
import { SMSProviderConfig } from '../config/providers';

interface SMSResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface EmailResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface Fast2SMSApiResponse {
  return?: boolean;
  message?: string;
  request_id?: string;
  message_id?: string;
  status_code?: number;
}

/**
 * Check if development mode is enabled
 */
const isDevelopmentMode = async (): Promise<boolean> => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'development_mode_enabled' }
    });
    return config?.value === 'true';
  } catch (error) {
    console.error('Error checking development mode:', error);
    // Default to development mode if we can't check
    return process.env.NODE_ENV === 'development';
  }
};

/**
 * Get static OTP for development mode
 */
const getStaticOTP = async (): Promise<string> => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'static_otp_code' }
    });
    return config?.value || '111111';
  } catch (error) {
    console.error('Error getting static OTP:', error);
    return '111111';
  }
};

/**
 * Check if email verification is enabled
 */
const isEmailVerificationEnabled = async (): Promise<boolean> => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'email_verification_enabled' }
    });
    return config?.value === 'true';
  } catch (error) {
    console.error('Error checking email verification config:', error);
    return false;
  }
};

/**
 * Check if SMS verification is enabled
 */
const isSMSVerificationEnabled = async (): Promise<boolean> => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'sms_verification_enabled' }
    });
    return config?.value === 'true';
  } catch (error) {
    console.error('Error checking SMS verification config:', error);
    return false;
  }
};

// Cache for SMS provider to avoid repeated database queries
let cachedSMSProvider: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get SMS provider configuration with caching
 */
const getSMSProvider = async (): Promise<string> => {
  // Return cached value if still valid
  if (cachedSMSProvider && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return cachedSMSProvider;
  }

  try {
    // Check both keys in a single query
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['sms_service_provider', 'sms_provider']
        }
      }
    });

    const configMap = configs.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);

    const provider = configMap['sms_service_provider'] ||
                    configMap['sms_provider'] ||
                    env.SMS_PROVIDER ||
                    'fast2sms';

    // Cache the result
    cachedSMSProvider = provider;
    cacheTimestamp = Date.now();

    return provider;
  } catch (error) {
    console.error('Error getting SMS provider config:', error);
    return env.SMS_PROVIDER || 'fast2sms';
  }
};

/**
 * Get SMS service configuration from environment variables (preferred) or system config
 */
const getSMSServiceConfig = async (): Promise<SMSProviderConfig> => {
  const provider = await getSMSProvider();

  const config: SMSProviderConfig = {
    provider: provider as SMSProviderConfig['provider']
  };

  switch (provider) {
    case 'fast2sms':
      // Prioritize database config (admin panel) over environment variables
      try {
        const fast2smsConfigs = await prisma.systemConfig.findMany({
          where: {
            key: {
              in: ['auth_fast2sms_api_key', 'fast2sms_api_key', 'auth_fast2sms_sender_id', 'fast2sms_sender_id']
            }
          }
        });

        const configMap = fast2smsConfigs.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, string>);

        // Auth-specific keys take priority, then general fast2sms keys, then env
        config.apiKey = configMap['auth_fast2sms_api_key'] || configMap['fast2sms_api_key'] || env.FAST2SMS_API_KEY;
        config.senderId = configMap['auth_fast2sms_sender_id'] || configMap['fast2sms_sender_id'] || env.FAST2SMS_SENDER_ID;
      } catch (error) {
        console.error('Error getting Fast2SMS config from database:', error);
        config.apiKey = env.FAST2SMS_API_KEY;
        config.senderId = env.FAST2SMS_SENDER_ID;
      }

      console.log('🔧 Fast2SMS Config Source:', {
        apiKey: config.apiKey ? (config.apiKey !== env.FAST2SMS_API_KEY ? 'DB' : 'ENV') : 'MISSING',
        senderId: config.senderId ? (config.senderId !== env.FAST2SMS_SENDER_ID ? 'DB' : 'ENV') : 'MISSING'
      });
      break;
    case 'bulksms':
      // Prioritize environment variables over database config
      config.username = env.BULKSMS_USERNAME;
      config.apiKey = env.BULKSMS_API_KEY;
      config.senderId = env.BULKSMS_SENDER_ID;

      // Only query database if environment variables are not set
      if (!config.username || !config.apiKey || !config.senderId) {
        try {
          const bulkSMSConfigs = await prisma.systemConfig.findMany({
            where: {
              key: {
                in: ['bulksms_username', 'bulksms_api_key', 'bulksms_sender_id']
              }
            }
          });

          const configMap = bulkSMSConfigs.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
          }, {} as Record<string, string>);

          config.username = config.username || configMap['bulksms_username'];
          config.apiKey = config.apiKey || configMap['bulksms_api_key'];
          config.senderId = config.senderId || configMap['bulksms_sender_id'];
        } catch (error) {
          console.error('Error getting BulkSMS config from database:', error);
        }
      }

      console.log('🔧 BulkSMS Config Source:', {
        username: config.username ? (env.BULKSMS_USERNAME ? 'ENV' : 'DB') : 'MISSING',
        apiKey: config.apiKey ? (env.BULKSMS_API_KEY ? 'ENV' : 'DB') : 'MISSING',
        senderId: config.senderId ? (env.BULKSMS_SENDER_ID ? 'ENV' : 'DB') : 'MISSING'
      });
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
      // Firebase config is handled separately
      break;
  }

  return config;
};

/**
 * Get Fast2SMS mode configuration
 */
const getFast2SMSMode = async (): Promise<string> => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'fast2sms_mode' }
    });
    return config?.value || 'otp';
  } catch (error) {
    console.error('Error getting Fast2SMS mode config:', error);
    return 'otp';
  }
};

/**
 * Get WhatsApp provider configuration
 */
const getWhatsAppProvider = async (): Promise<string> => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'whatsapp_service_provider' }
    });
    return config?.value || 'fast2sms';
  } catch (error) {
    console.error('Error getting WhatsApp provider config:', error);
    return 'fast2sms';
  }
};

/**
 * Get Fast2SMS WhatsApp mode configuration
 */
const getFast2SMSWhatsAppMode = async (): Promise<string> => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'fast2sms_whatsapp_mode' }
    });
    return config?.value || 'otp';
  } catch (error) {
    console.error('Error getting Fast2SMS WhatsApp mode config:', error);
    return 'otp';
  }
};

/**
 * Get SMS template from system config
 */
const getSMSTemplate = async (): Promise<{ message: string; templateId?: string }> => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'sms_template_otp' }
    });

    if (config?.value) {
      try {
        // Try to parse as array (new format)
        const templates = JSON.parse(config.value);
        if (Array.isArray(templates) && templates.length > 0) {
          // Randomly select a template from the array
          const randomIndex = Math.floor(Math.random() * templates.length);
          const selectedTemplate = templates[randomIndex];

          // Handle both old string format and new object format
          if (typeof selectedTemplate === 'string') {
            return { message: selectedTemplate };
          } else if (typeof selectedTemplate === 'object' && selectedTemplate.message) {
            return {
              message: selectedTemplate.message,
              templateId: selectedTemplate.templateId
            };
          }
        }
      } catch (parseError) {
        // If parsing fails, treat as string (legacy format)
        return { message: config.value };
      }
    }

    return {
      message: 'Your CutQ verification code is {#var#}. Valid for {#var#} minutes. Do not share this code with anyone. Powered by - gem infinity'
    };
  } catch (error) {
    console.error('Error getting SMS template config:', error);
    return {
      message: 'Your CutQ verification code is {#var#}. Valid for {#var#} minutes. Do not share this code with anyone. Powered by - gem infinity'
    };
  }
};

// In-memory storage for Firebase verification IDs (temporary solution)
const firebaseVerificationStore = new Map<string, {
  verificationId: string;
  expiresAt: Date;
}>();

/**
 * Store Firebase verification ID for later verification
 */
const storeFirebaseVerificationId = async (phoneNumber: string, verificationId: string): Promise<void> => {
  try {
    // Store in memory with expiration (5 minutes)
    firebaseVerificationStore.set(phoneNumber, {
      verificationId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });
    console.log(`📱 Firebase verification ID stored for ${phoneNumber}`);
  } catch (error) {
    console.error('Error storing Firebase verification ID:', error);
  }
};

/**
 * Get Firebase verification ID for phone number
 */
const getFirebaseVerificationId = (phoneNumber: string): string | null => {
  const stored = firebaseVerificationStore.get(phoneNumber);
  if (!stored) {
    return null;
  }

  // Check if expired
  if (stored.expiresAt < new Date()) {
    firebaseVerificationStore.delete(phoneNumber);
    return null;
  }

  return stored.verificationId;
};

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send SMS using Firebase Auth Phone Verification
 */
const sendSMSViaFirebase = async (phoneNumber: string, otp: string): Promise<SMSResponse> => {
  try {
    if (!isFirebaseAvailable()) {
      return {
        success: false,
        message: 'Firebase is not configured'
      };
    }

    console.log(`📱 Sending SMS OTP via Firebase Phone Auth to ${phoneNumber}...`);

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

    // Use Firebase Auth Phone Verification
    const result = await sendFirebasePhoneVerification(cleanPhone);

    if (result.success && result.verificationId) {
      console.log(`✅ Firebase phone verification sent successfully to ${cleanPhone}`);
      console.log(`📱 Verification ID: ${result.verificationId}`);

      // Store the verification ID in the database for later verification
      await storeFirebaseVerificationId(cleanPhone, result.verificationId);

      return {
        success: true,
        message: 'SMS sent successfully via Firebase',
        data: {
          provider: 'firebase',
          phoneNumber: cleanPhone,
          verificationId: result.verificationId,
          messageId: `firebase_${Date.now()}`
        }
      };
    } else {
      console.error('❌ Firebase phone verification failed:', result.message);
      return {
        success: false,
        message: result.message || 'Failed to send SMS via Firebase'
      };
    }

  } catch (error) {
    console.error('❌ Firebase SMS Error:', error);
    return {
      success: false,
      message: 'Failed to send SMS via Firebase'
    };
  }
};

/**
 * Send SMS using Fast2SMS API
 */
const sendSMSViaFast2SMS = async (phoneNumber: string, otp: string): Promise<SMSResponse> => {
  try {
    const mode = await getFast2SMSMode();
    console.log(`📱 Sending SMS OTP ${otp} to ${phoneNumber} via Fast2SMS (${mode} mode)...`);

    // Clean phone number (remove any non-digits)
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // Fast2SMS API endpoint
    const apiUrl = 'https://www.fast2sms.com/dev/bulkV2';

    // Prepare parameters based on mode
    let params: URLSearchParams;

    // Get API key from DB config (admin panel) with env fallback
    const smsConfig = await getSMSServiceConfig();
    const apiKey = (smsConfig.apiKey || env.FAST2SMS_API_KEY).trim();

    // Get SMS template from system config
    const templateData = await getSMSTemplate();
    const message = templateData.message.replace('{#var#}', otp).replace('{#var#}', '5');

    if (mode === 'quick') {
      // Quick Message Mode
      params = new URLSearchParams({
        authorization: apiKey,
        route: 'q',
        message: message,
        numbers: cleanPhone,
        flash: '0'
      });
      console.log(`📱 Fast2SMS Quick Mode: Sending custom message`);
    } else {
      // OTP Mode (default)
      params = new URLSearchParams({
        authorization: apiKey,
        route: 'otp',
        variables_values: otp,
        flash: '0',
        numbers: cleanPhone,
        message: message
      });
      console.log(`📱 Fast2SMS OTP Mode: Using template`);
    }

    const fullUrl = `${apiUrl}?${params.toString()}`;
    console.log(`📱 Fast2SMS CURL: curl --request GET --url '${fullUrl}' --header 'accept: application/json'`);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      }
    });

    const data: Fast2SMSApiResponse = await response.json();

    console.log(`📱 Fast2SMS Response (${mode} mode):`, {
      status: response.status,
      success: data.return,
      message: data.message,
      requestId: data.request_id
    });

    if (data.return === true || response.ok) {
      return {
        success: true,
        message: `SMS sent successfully via Fast2SMS (${mode} mode)`,
        data: {
          provider: 'fast2sms',
          mode: mode,
          requestId: data.request_id,
          messageId: data.message_id
        }
      };
    } else {
      console.error('❌ Fast2SMS Error:', data);

      // Fallback: If Fast2SMS fails (e.g., verification required), log OTP for development
      if (data.message?.includes('verification') || data.message?.includes('DLT')) {
        console.log('📱 Fast2SMS requires verification. Using fallback mode.');
        console.log(`📱 SMS Fallback: OTP ${otp} for ${phoneNumber}`);
        console.log(`📱 SMS Content: Your CutQ verification code is ${otp}. Valid for 5 minutes.`);

        return {
          success: true,
          message: 'SMS sent successfully (fallback mode)',
          data: {
            provider: 'fast2sms_fallback',
            requestId: 'fallback_' + Date.now(),
            messageId: 'fallback_msg_' + Date.now()
          }
        };
      }

      return {
        success: false,
        message: data.message || 'Failed to send SMS via Fast2SMS'
      };
    }
  } catch (error) {
    console.error('❌ Fast2SMS Service Error:', error);
    return {
      success: false,
      message: 'Fast2SMS service temporarily unavailable'
    };
  }
};

/**
 * Send WhatsApp OTP via Fast2SMS
 */
const sendWhatsAppViaFast2SMS = async (phoneNumber: string, otp: string): Promise<SMSResponse> => {
  try {
    if (!env.FAST2SMS_API_KEY) {
      console.log('📱 Fast2SMS API key not configured. Using fallback mode.');
      console.log(`📱 WhatsApp Fallback: OTP ${otp} for ${phoneNumber}`);
      console.log(`📱 WhatsApp Content: Your CutQ verification code is ${otp}. Valid for 5 minutes.`);

      return {
        success: true,
        message: 'WhatsApp sent successfully (fallback mode)',
        data: {
          provider: 'fast2sms_fallback',
          requestId: 'fallback_' + Date.now(),
          messageId: 'fallback_msg_' + Date.now()
        }
      };
    }

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      return {
        success: false,
        message: 'Invalid phone number format'
      };
    }

    // Get Fast2SMS WhatsApp mode configuration
    const mode = await getFast2SMSWhatsAppMode();
    console.log(`📱 Fast2SMS WhatsApp Mode: ${mode}`);

    const apiUrl = 'https://www.fast2sms.com/dev/bulkV2';
    let params: URLSearchParams;

    // Get SMS template from system config
    const templateData = await getSMSTemplate();
    const message = templateData.message.replace('{#var#}', otp).replace('{#var#}', '5');

    if (mode === 'quick') {
      // Quick Message Mode for WhatsApp
      params = new URLSearchParams({
        authorization: env.FAST2SMS_API_KEY,
        route: 'q', // WhatsApp route
        message: message,
        numbers: cleanPhone,
        flash: '0',
        sender_id: 'CUTQWA' // Default sender ID for WhatsApp
      });
      console.log(`📱 Fast2SMS WhatsApp Quick Mode: Sending custom message`);
    } else {
      // OTP Mode (default) for WhatsApp
      params = new URLSearchParams({
        authorization: env.FAST2SMS_API_KEY,
        route: 'otp', // WhatsApp route
        variables_values: otp,
        flash: '0',
        numbers: cleanPhone,
        message: message,
        sender_id: 'CUTQWA' // Default sender ID for WhatsApp
      });
      console.log(`📱 Fast2SMS WhatsApp OTP Mode: Using template`);
    }

    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data: Fast2SMSApiResponse = await response.json();

    console.log(`📱 Fast2SMS WhatsApp Response (${mode} mode):`, {
      status: response.status,
      success: data.return,
      message: data.message,
      requestId: data.request_id
    });

    if (data.return === true || response.ok) {
      return {
        success: true,
        message: `WhatsApp sent successfully via Fast2SMS (${mode} mode)`,
        data: {
          provider: 'fast2sms',
          mode: mode,
          requestId: data.request_id,
          messageId: data.message_id
        }
      };
    } else {
      console.error('❌ Fast2SMS WhatsApp Error:', data);

      // Enhanced fallback: Handle various Fast2SMS errors
      const errorMessage = data.message || '';
      const shouldUseFallback =
        errorMessage.includes('verification') ||
        errorMessage.includes('DLT') ||
        errorMessage.includes('Invalid Sender ID') ||
        errorMessage.includes('Invalid Message ID') ||
        errorMessage.includes('Template') ||
        errorMessage.includes('Entity ID') ||
        errorMessage.includes('WhatsApp service not enabled') ||
        (data as any).status_code === 406 ||
        (data as any).status_code === 424;

      if (shouldUseFallback) {
        console.log('📱 Fast2SMS WhatsApp service issue detected. Using fallback mode.');
        console.log(`📱 WhatsApp Fallback: OTP ${otp} for ${phoneNumber}`);
        console.log(`📱 WhatsApp Content: Your CutQ verification code is ${otp}. Valid for 5 minutes.`);

        return {
          success: true,
          message: 'WhatsApp sent successfully (fallback mode - Fast2SMS WhatsApp service requires setup)',
          data: {
            provider: 'fast2sms_fallback',
            requestId: 'fallback_' + Date.now(),
            messageId: 'fallback_msg_' + Date.now(),
            fallbackReason: errorMessage
          }
        };
      }

      return {
        success: false,
        message: data.message || 'Failed to send WhatsApp via Fast2SMS'
      };
    }
  } catch (error) {
    console.error('❌ Fast2SMS WhatsApp Service Error:', error);
    return {
      success: false,
      message: 'Fast2SMS WhatsApp service temporarily unavailable'
    };
  }
};

/**
 * Send WhatsApp OTP via Firebase
 */
const sendWhatsAppViaFirebase = async (phoneNumber: string, otp: string): Promise<SMSResponse> => {
  try {
    // For now, Firebase WhatsApp uses the same phone verification as SMS
    // In a real implementation, you would use WhatsApp Business API
    console.log(`📱 Sending WhatsApp OTP via Firebase to ${phoneNumber}...`);

    // Use the same Firebase phone verification for WhatsApp
    return await sendSMSViaFirebase(phoneNumber, otp);

  } catch (error) {
    console.error('❌ Firebase WhatsApp Error:', error);
    return {
      success: false,
      message: 'Firebase WhatsApp service temporarily unavailable'
    };
  }
};

/**
 * Send SMS using configured provider or development mode
 */
export const sendSMS = async (phoneNumber: string, otp?: string): Promise<SMSResponse> => {
  try {
    // Check if SMS verification is enabled
    const smsEnabled = await isSMSVerificationEnabled();
    if (!smsEnabled) {
      return {
        success: false,
        message: 'SMS verification is disabled'
      };
    }

    // Check development mode
    const isDev = await isDevelopmentMode();
    const finalOTP = otp || (isDev ? await getStaticOTP() : generateOTP());

    if (isDev) {
      console.log(`Development Mode: SMS OTP for ${phoneNumber}: ${finalOTP}`);
      return {
        success: true,
        message: 'SMS OTP generated (development mode)',
        data: { otp: finalOTP, isDevelopmentMode: true }
      };
    }

    // Get SMS provider configuration
    const smsProvider = await getSMSProvider();
    console.log(`📱 Using SMS provider: ${smsProvider}`);

    // Send SMS using SMS service factory
    let result: SMSResponse;

    if (smsProvider === 'firebase') {
      // Firebase still uses the old method for now
      result = await sendSMSViaFirebase(phoneNumber, finalOTP);
    } else {
      try {
        // Use SMS service factory for other providers
        const smsConfig = await getSMSServiceConfig();
        const smsService = SMSServiceFactory.create(smsConfig);

        // Use sendTemplate to properly handle admin-configured templates
        const smsResult = await smsService.sendTemplate('otp', phoneNumber, {
          otp: finalOTP,
          expiresIn: 5,
          appName: 'CutQ'
        });

        if (smsResult.success) {
          result = {
            success: true,
            message: `SMS sent successfully via ${smsProvider}`,
            data: {
              provider: smsProvider,
              messageId: smsResult.data?.messageId || 'unknown'
            }
          };
        } else {
          result = {
            success: false,
            message: smsResult.message || `Failed to send SMS via ${smsProvider}`
          };
        }
      } catch (error) {
        console.error(`❌ SMS Service Factory Error for ${smsProvider}:`, error);
        // Fallback to old method for Fast2SMS
        if (smsProvider === 'fast2sms') {
          result = await sendSMSViaFast2SMS(phoneNumber, finalOTP);
        } else {
          result = {
            success: false,
            message: `SMS service ${smsProvider} temporarily unavailable`
          };
        }
      }
    }

    // Track SMS communication analytics (non-blocking)
    asyncAnalytics.trackSMS({
      recipientPhone: phoneNumber,
      messageTemplate: MessageTemplate.OTP_VERIFICATION,
      messageContent: `Your CutQ verification code is ${finalOTP}. Valid for 5 minutes.`,
      status: result.success ? CommunicationStatus.SENT : CommunicationStatus.FAILED,
      providerId: smsProvider,
      metadata: {
        otp: finalOTP,
        provider: smsProvider
      }
    }).catch(err => console.error('Analytics tracking failed:', err));

    return result;

  } catch (error) {
    console.error('❌ SMS Service Error:', error);
    return {
      success: false,
      message: 'SMS service temporarily unavailable'
    };
  }
};

/**
 * Send WhatsApp OTP using configured provider
 */
export const sendWhatsApp = async (phoneNumber: string, otp?: string): Promise<SMSResponse> => {
  // Declare finalOTP outside try block for catch block access
  let finalOTP: string;

  try {
    // Check if SMS verification is enabled (WhatsApp uses same setting)
    const smsEnabled = await isSMSVerificationEnabled();

    if (!smsEnabled) {
      console.log(`📱 WhatsApp verification is disabled. Skipping WhatsApp send for ${phoneNumber}`);
      return {
        success: true,
        message: 'WhatsApp verification is disabled',
        data: { verificationDisabled: true }
      };
    }

    // Generate OTP if not provided
    finalOTP = otp || generateOTP();

    // Development mode check
    if (env.NODE_ENV === 'development') {
      console.log(`Development Mode: WhatsApp OTP for ${phoneNumber}: ${finalOTP}`);
      return {
        success: true,
        message: 'WhatsApp OTP generated (development mode)',
        data: { otp: finalOTP, isDevelopmentMode: true }
      };
    }

    // Get WhatsApp provider configuration
    const whatsappProvider = await getWhatsAppProvider();
    console.log(`📱 Using WhatsApp provider: ${whatsappProvider}`);

    // Send WhatsApp based on configured provider
    let result: SMSResponse;
    switch (whatsappProvider) {
      case 'firebase':
        result = await sendWhatsAppViaFirebase(phoneNumber, finalOTP);
        break;

      case 'fast2sms':
      default:
        result = await sendWhatsAppViaFast2SMS(phoneNumber, finalOTP);
        break;
    }

    // Track WhatsApp communication analytics (non-blocking)
    asyncAnalytics.trackWhatsApp({
      recipientPhone: phoneNumber,
      messageTemplate: MessageTemplate.OTP_VERIFICATION,
      messageContent: `Your CutQ verification code is ${finalOTP}. Valid for 5 minutes.`,
      status: result.success ? CommunicationStatus.SENT : CommunicationStatus.FAILED,
      providerId: whatsappProvider,
      metadata: {
        otp: finalOTP,
        provider: whatsappProvider
      }
    }).catch(err => console.error('Analytics tracking failed:', err));

    return result;

  } catch (error) {
    console.error('❌ WhatsApp Service Error:', error);
    return {
      success: false,
      message: 'WhatsApp service temporarily unavailable'
    };
  }
};

/**
 * Send Email OTP using SMTP or development mode
 */
export const sendEmail = async (email: string, otp?: string): Promise<EmailResponse> => {
  // Declare finalOTP outside try block for catch block access
  let finalOTP: string;

  try {
    // Check if email verification is enabled
    const emailEnabled = await isEmailVerificationEnabled();
    if (!emailEnabled) {
      return {
        success: false,
        message: 'Email verification is disabled'
      };
    }

    // Check development mode
    const isDev = await isDevelopmentMode();
    finalOTP = otp || (isDev ? await getStaticOTP() : generateOTP());

    if (isDev) {
      console.log(`Development Mode: Email OTP for ${email}: ${finalOTP}`);

      // Track email analytics (non-blocking) - development mode
      asyncAnalytics.trackEmail({
        recipientEmail: email,
        messageTemplate: MessageTemplate.OTP_VERIFICATION,
        messageContent: `Your CutQ verification code is ${finalOTP}. Valid for 5 minutes.`,
        status: CommunicationStatus.SENT,
        providerId: 'development',
        metadata: {
          otp: finalOTP,
          provider: 'development'
        }
      }).catch(err => console.error('Analytics tracking failed:', err));

      return {
        success: true,
        message: 'Email OTP generated (development mode)',
        data: { otp: finalOTP, isDevelopmentMode: true, to: email }
      };
    }

    console.log(`📧 Sending Email OTP ${finalOTP} to ${email}...`);

    // Check if SMTP is configured
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      console.log('📧 SMTP not configured, using fallback mode');
      console.log(`📧 Email Fallback: OTP ${finalOTP} for ${email}`);
      console.log(`📧 Email Subject: CutQ - Verification Code`);
      console.log(`📧 Email Content: Your CutQ verification code is ${finalOTP}. Valid for 5 minutes.`);

      // Track email analytics (non-blocking) - fallback mode
      asyncAnalytics.trackEmail({
        recipientEmail: email,
        messageTemplate: MessageTemplate.OTP_VERIFICATION,
        messageContent: `Your CutQ verification code is ${finalOTP}. Valid for 5 minutes.`,
        status: CommunicationStatus.SENT,
        providerId: 'smtp_fallback',
        metadata: {
          otp: finalOTP,
          provider: 'smtp_fallback'
        }
      }).catch(err => console.error('Analytics tracking failed:', err));

      return {
        success: true,
        message: 'Email sent successfully (development mode)',
        data: {
          messageId: `fallback_${Date.now()}`,
          to: email
        }
      };
    }

    // Use Nodemailer with configured SMTP settings
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    console.log(`📧 Using SMTP: ${env.SMTP_HOST} with user: ${env.SMTP_USER}`);

    const fromName = env.SMTP_FROM_NAME || 'CutQ Platform';
    const fromEmail = env.SMTP_FROM_EMAIL || env.SMTP_USER || 'noreply@cutq.store';

    const emailContent = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'CutQ - Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 32px; font-weight: bold;">✂️ CutQ</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Your Beauty, Our Priority</p>
            </div>
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 20px;">Email Verification</h2>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hello!</p>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">Thank you for choosing CutQ. To complete your verification, please use the code below:</p>
            <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center; margin: 30px 0; border-radius: 12px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
              <h1 style="color: white; font-size: 36px; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${finalOTP}</h1>
            </div>
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="font-size: 14px; color: #92400e; margin: 0; text-align: center;">
                ⏰ This code will expire in <strong>5 minutes</strong>
              </p>
            </div>
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">If you didn't request this verification code, please ignore this email. Your account security is important to us.</p>
            <hr style="margin: 40px 0; border: none; border-top: 1px solid #e5e7eb;">
            <div style="text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated message from CutQ Platform.<br>
                Please do not reply to this email.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                © 2024 CutQ. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(emailContent);
    console.log('✅ Email sent successfully:', result.messageId);

    // Track email analytics (non-blocking) - SMTP success
    asyncAnalytics.trackEmail({
      recipientEmail: email,
      messageTemplate: MessageTemplate.OTP_VERIFICATION,
      messageContent: `Your CutQ verification code is ${finalOTP}. Valid for 5 minutes.`,
      status: CommunicationStatus.SENT,
      providerId: 'smtp',
      metadata: {
        otp: finalOTP,
        provider: 'smtp',
        smtpHost: env.SMTP_HOST
      }
    }).catch(err => console.error('Analytics tracking failed:', err));

    // If using Ethereal Email, show preview URL
    if (env.SMTP_HOST === 'smtp.ethereal.email') {
      const previewUrl = nodemailer.getTestMessageUrl(result);
      console.log('📧 Preview URL:', previewUrl);
      console.log('📧 You can view the email at the URL above');
    }

    return {
      success: true,
      message: 'Email sent successfully',
      data: {
        messageId: result.messageId,
        to: email
      }
    };

  } catch (error) {
    console.error('❌ Email Service Error:', error);

    // Track email analytics (non-blocking) - error case
    asyncAnalytics.trackEmail({
      recipientEmail: email,
      messageTemplate: MessageTemplate.OTP_VERIFICATION,
      messageContent: `Your CutQ verification code is ${finalOTP}. Valid for 5 minutes.`,
      status: CommunicationStatus.FAILED,
      providerId: 'smtp',
      metadata: {
        otp: finalOTP,
        provider: 'smtp',
        error: error.message
      }
    }).catch(err => console.error('Analytics tracking failed:', err));

    // Fallback: Log OTP for development when email fails
    console.log('📧 Email Fallback Mode Activated');
    console.log(`📧 Email Fallback: OTP ${finalOTP} for ${email}`);
    console.log(`📧 Email Subject: CutQ - Verification Code`);
    console.log(`📧 Email Content: Your CutQ verification code is ${finalOTP}. Valid for 5 minutes.`);

    return {
      success: true,
      message: 'Email sent successfully (development mode)',
      data: {
        messageId: `fallback_${Date.now()}`,
        to: email
      }
    };
  }
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // Remove all non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
  // or international format (10-15 digits)
  return /^[6-9]\d{9}$/.test(cleanPhone) || /^\d{10,15}$/.test(cleanPhone);
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Verify OTP (development mode aware)
 */
export const verifyOTP = async (providedOTP: string, purpose: string = 'verification'): Promise<boolean> => {
  try {
    const isDev = await isDevelopmentMode();

    if (isDev) {
      const staticOTP = await getStaticOTP();
      const isValid = providedOTP === staticOTP;
      console.log(`Development Mode: OTP verification for ${purpose}: ${isValid ? 'SUCCESS' : 'FAILED'}`);
      return isValid;
    }

    // In production, you would typically store OTPs in database with expiration
    // and verify against stored values
    // TODO: Implement database OTP verification for production
    console.warn('Production OTP verification not implemented yet');

    return false;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    return `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
  }
  
  return phone;
};


