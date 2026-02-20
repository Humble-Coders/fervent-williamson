/**
 * Notification Provider Service
 * Handles provider configuration for notification services (SMS, Email)
 */

import { prisma } from '../config/database';
import { env } from '../config/env';
import { SMSProviderConfig, EmailProviderConfig } from '../config/providers';

// Cache for notification providers to avoid repeated database queries
let cachedNotificationSMSProvider: string | null = null;
let cachedNotificationEmailProvider: string | null = null;
let smsProviderCacheTimestamp: number = 0;
let emailProviderCacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get notification SMS provider configuration with caching
 */
export const getNotificationSMSProvider = async (): Promise<string> => {
  // Return cached value if still valid
  if (cachedNotificationSMSProvider && (Date.now() - smsProviderCacheTimestamp) < CACHE_DURATION) {
    return cachedNotificationSMSProvider;
  }

  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'notification_sms_service_provider' }
    });

    const provider = config?.value || env.SMS_PROVIDER || 'fast2sms';

    // Cache the result
    cachedNotificationSMSProvider = provider;
    smsProviderCacheTimestamp = Date.now();

    return provider;
  } catch (error) {
    console.error('Error getting notification SMS provider config:', error);
    return env.SMS_PROVIDER || 'fast2sms';
  }
};

/**
 * Get notification email provider configuration with caching
 */
export const getNotificationEmailProvider = async (): Promise<string> => {
  // Return cached value if still valid
  if (cachedNotificationEmailProvider && (Date.now() - emailProviderCacheTimestamp) < CACHE_DURATION) {
    return cachedNotificationEmailProvider;
  }

  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'notification_email_service_provider' }
    });

    const provider = config?.value || 'smtp';

    // Cache the result
    cachedNotificationEmailProvider = provider;
    emailProviderCacheTimestamp = Date.now();

    return provider;
  } catch (error) {
    console.error('Error getting notification email provider config:', error);
    return 'smtp';
  }
};

/**
 * Get notification SMS service configuration
 */
export const getNotificationSMSServiceConfig = async (): Promise<SMSProviderConfig> => {
  const provider = await getNotificationSMSProvider();

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
              in: ['notification_fast2sms_api_key', 'fast2sms_api_key', 'notification_fast2sms_sender_id', 'fast2sms_sender_id']
            }
          }
        });

        const configMap = fast2smsConfigs.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, string>);

        // Notification-specific keys take priority, then general fast2sms keys, then env
        config.apiKey = configMap['notification_fast2sms_api_key'] || configMap['fast2sms_api_key'] || env.FAST2SMS_API_KEY;
        config.senderId = configMap['notification_fast2sms_sender_id'] || configMap['fast2sms_sender_id'] || env.FAST2SMS_SENDER_ID;
      } catch (error) {
        console.error('Error getting Fast2SMS config from database:', error);
        config.apiKey = env.FAST2SMS_API_KEY;
        config.senderId = env.FAST2SMS_SENDER_ID;
      }
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
 * Get notification email service configuration
 */
export const getNotificationEmailServiceConfig = async (): Promise<EmailProviderConfig> => {
  const provider = await getNotificationEmailProvider();

  const config: EmailProviderConfig = {
    provider: provider as EmailProviderConfig['provider']
  };

  switch (provider) {
    case 'smtp':
    case 'outlook':
      config.host = env.SMTP_HOST;
      config.port = env.SMTP_PORT;
      config.secure = env.SMTP_SECURE === 'true';
      config.user = env.SMTP_USER;
      config.pass = env.SMTP_PASS;
      config.fromEmail = env.SMTP_FROM_EMAIL;
      config.fromName = env.SMTP_FROM_NAME;
      break;
  }

  return config;
};

