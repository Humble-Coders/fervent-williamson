/**
 * Twilio SMS Provider Implementation
 */

import { BaseService } from '../../../core/BaseService';
import { ISMSService, SMSData, ServiceResponse } from '../../../interfaces/services';
import { SMSProviderConfig } from '../../../config/providers';
import { prisma } from '../../../config/database';

export class TwilioProvider extends BaseService implements ISMSService {
  private config: SMSProviderConfig;

  constructor(config: SMSProviderConfig) {
    super();
    this.config = config;
  }

  async sendSMS(data: SMSData): Promise<ServiceResponse<{ messageId: string }>> {
    try {
      if (!this.config.accountSid || !this.config.authToken || !this.config.fromNumber) {
        return this.error('Twilio configuration incomplete');
      }

      const { to, message } = data;
      
      // Format phone number for Twilio (must include country code)
      const formattedTo = to.startsWith('+') ? to : `+${to}`;

      // Create Twilio client
      const auth = Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64');

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: this.config.fromNumber,
          To: formattedTo,
          Body: message
        })
      });

      const result = await response.json() as {
        message?: string;
        sid?: string;
      };

      if (!response.ok) {
        this.logError('Twilio send failed', result);
        return this.error(`Twilio error: ${result.message || 'Unknown error'}`);
      }

      this.logOperation('SMS sent via Twilio', { to: formattedTo, messageId: result.sid });

      return this.success({
        messageId: result.sid
      });

    } catch (error) {
      this.logError('Twilio send error', error);
      return this.error('Failed to send SMS via Twilio');
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
        template = config?.value || this.getTemplates()[templateName];
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

    // Replace template variables - handle both {{var}} and {#var#} formats
    let message = template;
    for (const [key, value] of Object.entries(data)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      message = message.replace('{#var#}', String(value));
    }

    return this.sendSMS({ to, message });
  }

  async verifyConnection(): Promise<ServiceResponse<boolean>> {
    try {
      if (!this.config.accountSid || !this.config.authToken) {
        return this.error('Twilio configuration incomplete');
      }

      // Test connection by fetching account info
      const auth = Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64');

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}.json`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
        }
      });

      const result = await response.json() as {
        sid?: string;
      };

      if (response.ok && result.sid) {
        this.logOperation('Twilio connection verified', { accountSid: result.sid });
        return this.success(true, 'Twilio connection verified');
      } else {
        return this.error('Twilio connection failed');
      }

    } catch (error) {
      this.logError('Twilio connection test failed', error);
      return this.error('Failed to verify Twilio connection');
    }
  }

  private getTemplates(): Record<string, string> {
    return {
      otp: 'Your {{appName}} verification code is {{otp}}. Valid for {{expiresIn}} minutes. Do not share this code.',
      welcome: 'Welcome to {{appName}}! Your account has been created successfully.',
      booking_confirmation: 'Your booking at {{businessName}} on {{date}} at {{time}} has been confirmed. Booking ID: {{bookingId}}',
      booking_reminder: 'Reminder: You have a booking at {{businessName}} tomorrow at {{time}}. Booking ID: {{bookingId}}',
      password_reset: 'Your {{appName}} password reset code is {{otp}}. Valid for {{expiresIn}} minutes.',
    };
  }
}
