/**
 * SMS Service Factory
 * Creates SMS service instances based on configuration
 */

import { ISMSService } from '../../interfaces/services';
import { SMSProviderConfig } from '../../config/providers';
import { Fast2SMSProvider } from './providers/Fast2SMSProvider';
import { TwilioProvider } from './providers/TwilioProvider';
import { FirebaseSMSProvider } from './providers/FirebaseSMSProvider';
import { AWSSNSProvider } from './providers/AWSSNSProvider';
import { BulkSMSProvider } from './providers/BulkSMSProvider';

export class SMSServiceFactory {
  static create(config: SMSProviderConfig): ISMSService {
    switch (config.provider) {
      case 'fast2sms':
        return new Fast2SMSProvider(config);
      
      case 'twilio':
        return new TwilioProvider(config);
      
      case 'firebase':
        return new FirebaseSMSProvider(config);
      
      case 'aws-sns':
        return new AWSSNSProvider(config);

      case 'bulksms':
        return new BulkSMSProvider(config);

      default:
        throw new Error(`Unsupported SMS provider: ${config.provider}`);
    }
  }

  static getSupportedProviders(): string[] {
    return ['fast2sms', 'twilio', 'firebase', 'aws-sns', 'bulksms'];
  }

  static validateConfig(config: SMSProviderConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.provider) {
      errors.push('SMS provider is required');
      return { isValid: false, errors };
    }

    switch (config.provider) {
      case 'fast2sms':
        if (!config.apiKey) {
          errors.push('Fast2SMS API key is required');
        }
        break;

      case 'twilio':
        if (!config.accountSid) {
          errors.push('Twilio Account SID is required');
        }
        if (!config.authToken) {
          errors.push('Twilio Auth Token is required');
        }
        if (!config.fromNumber) {
          errors.push('Twilio From Number is required');
        }
        break;

      case 'firebase':
        // Firebase config is validated separately
        break;

      case 'aws-sns':
        if (!config.region) {
          errors.push('AWS region is required');
        }
        if (!config.accessKeyId) {
          errors.push('AWS Access Key ID is required');
        }
        if (!config.secretAccessKey) {
          errors.push('AWS Secret Access Key is required');
        }
        break;

      case 'bulksms':
        if (!config.username) {
          errors.push('BulkSMS username is required');
        }
        if (!config.apiKey) {
          errors.push('BulkSMS API key is required');
        }
        if (!config.senderId) {
          errors.push('BulkSMS sender ID is required');
        }
        break;

      default:
        errors.push(`Unsupported SMS provider: ${config.provider}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
