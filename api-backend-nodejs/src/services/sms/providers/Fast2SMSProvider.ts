/**
 * Fast2SMS Provider Implementation
 */

import { BaseService } from '../../../core/BaseService';
import { ISMSService, SMSData, ServiceResponse } from '../../../interfaces/services';
import { SMSProviderConfig } from '../../../config/providers';
import { prisma } from '../../../config/database';

export class Fast2SMSProvider extends BaseService implements ISMSService {
  private config: SMSProviderConfig;

  constructor(config: SMSProviderConfig) {
    super();
    this.config = config;
  }

  async sendSMS(data: SMSData): Promise<ServiceResponse<{ messageId: string }>> {
    try {
      if (!this.config.apiKey) {
        return this.error('Fast2SMS API key not configured');
      }

      const { to, message } = data;

      // Clean phone number
      const cleanPhone = to.replace(/\D/g, '');

      if (!cleanPhone || cleanPhone.length < 10) {
        return this.error('Invalid phone number format');
      }

      // Prepare request parameters as query params (Fast2SMS expects GET with query params)
      const params = new URLSearchParams({
        authorization: this.config.apiKey.trim(),
        route: 'q',
        message: message,
        numbers: cleanPhone,
        flash: '0'
      });

      const fullUrl = `https://www.fast2sms.com/dev/bulkV2?${params.toString()}`;
      console.log(`📱 Fast2SMS CURL: curl --request GET --url '${fullUrl}' --header 'accept: application/json'`);

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        }
      });

      const result = await response.json() as {
        return?: boolean;
        message?: string;
        request_id?: string;
      };

      if (!response.ok || !result.return) {
        this.logError('Fast2SMS send failed', result);
        return this.error(`Fast2SMS error: ${result.message || 'Unknown error'}`);
      }

      this.logOperation('SMS sent via Fast2SMS', { to: cleanPhone, messageId: result.request_id });

      return this.success({
        messageId: result.request_id || `fast2sms_${Date.now()}`
      });

    } catch (error) {
      this.logError('Fast2SMS send error', error);
      return this.error('Failed to send SMS via Fast2SMS');
    }
  }

  async sendTemplate(templateName: string, to: string, data: Record<string, any>): Promise<ServiceResponse<{ messageId: string }>> {
    let template: string;

    // Get template from system config for OTP
    if (templateName === 'otp') {
      try {
        const config = await prisma.systemConfig.findUnique({
          where: { key: 'sms_template_otp' }
        });

        if (config?.value) {
          // Parse the template configuration (same as BulkSMS)
          const templateConfig = JSON.parse(config.value);

          if (Array.isArray(templateConfig)) {
            // Array format: use first template
            if (templateConfig.length > 0) {
              template = templateConfig[0].message;
              console.log('📋 Fast2SMS: Using admin-configured SMS template (array format):', template);
            } else {
              template = this.getTemplates()[templateName];
            }
          } else if (templateConfig.options && templateConfig.options.length > 0) {
            // Object format with options
            const activeTemplate = templateConfig.options.find((opt: any) => opt.id === templateConfig.defaultValue) || templateConfig.options[0];
            template = activeTemplate.message;
            console.log('📋 Fast2SMS: Using admin-configured SMS template (object format):', template);
          } else {
            template = this.getTemplates()[templateName];
          }
        } else {
          template = this.getTemplates()[templateName];
        }
      } catch (error) {
        console.error('Error fetching OTP template from config:', error);
        template = this.getTemplates()[templateName];
      }
    } else {
      const templates = this.getTemplates();
      template = templates[templateName];
    }

    if (!template) {
      return this.error(`Template '${templateName}' not found`);
    }

    // Replace {{key}} named placeholders
    let message = template;
    for (const [key, value] of Object.entries(data)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    // Replace {#var#} positional placeholders sequentially (same as BulkSMS)
    if (data.otp) {
      message = message.replace('{#var#}', data.otp);
    }
    if (data.expiresIn) {
      message = message.replace('{#var#}', data.expiresIn.toString());
    }
    // Clean up any remaining placeholders
    message = message.replace(/{#var#}/g, '');
    message = message.replace(/{{[^}]+}}/g, '');

    console.log('📱 Fast2SMS Final SMS message:', message);

    return this.sendSMS({ to, message });
  }

  async verifyConnection(): Promise<ServiceResponse<boolean>> {
    try {
      if (!this.config.apiKey) {
        return this.error('Fast2SMS API key not configured');
      }

      // Test with a simple balance check
      const response = await fetch('https://www.fast2sms.com/dev/wallet', {
        method: 'POST',
        headers: {
          'authorization': this.config.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      const result = await response.json() as {
        return?: boolean;
        wallet?: number;
      };

      if (response.ok && result.return) {
        this.logOperation('Fast2SMS connection verified', { balance: result.wallet });
        return this.success(true, 'Fast2SMS connection verified');
      } else {
        return this.error('Fast2SMS connection failed');
      }

    } catch (error) {
      this.logError('Fast2SMS connection test failed', error);
      return this.error('Failed to verify Fast2SMS connection');
    }
  }

  private getTemplates(): Record<string, string> {
    return {
      otp: 'Your {{appName}} verification code is {{otp}}. Valid for {{expiresIn}} minutes. Do not share this code with anyone.',
      welcome: 'Welcome to {{appName}}! Your account has been created successfully.',
      booking_confirmation: 'Your booking at {{businessName}} on {{date}} at {{time}} has been confirmed. Booking ID: {{bookingId}}',
      booking_reminder: 'Reminder: You have a booking at {{businessName}} tomorrow at {{time}}. Booking ID: {{bookingId}}',
      password_reset: 'Your {{appName}} password reset code is {{otp}}. Valid for {{expiresIn}} minutes.',
    };
  }
}
