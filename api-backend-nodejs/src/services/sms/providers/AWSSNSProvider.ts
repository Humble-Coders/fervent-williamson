/**
 * AWS SNS SMS Provider Implementation
 */

import { BaseService } from '../../../core/BaseService';
import { ISMSService, SMSData, ServiceResponse } from '../../../interfaces/services';
import { SMSProviderConfig } from '../../../config/providers';
import { prisma } from '../../../config/database';

export class AWSSNSProvider extends BaseService implements ISMSService {
  private config: SMSProviderConfig;

  constructor(config: SMSProviderConfig) {
    super();
    this.config = config;
  }

  async sendSMS(data: SMSData): Promise<ServiceResponse<{ messageId: string }>> {
    try {
      if (!this.config.region || !this.config.accessKeyId || !this.config.secretAccessKey) {
        return this.error('AWS SNS configuration incomplete');
      }

      const { to, message } = data;
      
      // Format phone number for AWS SNS (must include country code)
      const formattedTo = to.startsWith('+') ? to : `+${to}`;

      // Create AWS SNS request
      const snsRequest = await this.createSNSRequest('Publish', {
        PhoneNumber: formattedTo,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional'
          }
        }
      });

      const response = await fetch(`https://sns.${this.config.region}.amazonaws.com/`, {
        method: 'POST',
        headers: snsRequest.headers,
        body: snsRequest.body
      });

      const responseText = await response.text();

      if (!response.ok) {
        this.logError('AWS SNS send failed', { status: response.status, response: responseText });
        return this.error(`AWS SNS error: ${response.statusText}`);
      }

      // Parse XML response to get MessageId
      const messageIdMatch = responseText.match(/<MessageId>([^<]+)<\/MessageId>/);
      const messageId = messageIdMatch ? messageIdMatch[1] : `aws_sns_${Date.now()}`;

      this.logOperation('SMS sent via AWS SNS', { to: formattedTo, messageId });

      return this.success({
        messageId
      });

    } catch (error) {
      this.logError('AWS SNS send error', error);
      return this.error('Failed to send SMS via AWS SNS');
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
      if (!this.config.region || !this.config.accessKeyId || !this.config.secretAccessKey) {
        return this.error('AWS SNS configuration incomplete');
      }

      // Test connection by listing SMS attributes
      const snsRequest = await this.createSNSRequest('GetSMSAttributes', {});

      const response = await fetch(`https://sns.${this.config.region}.amazonaws.com/`, {
        method: 'POST',
        headers: snsRequest.headers,
        body: snsRequest.body
      });

      if (response.ok) {
        this.logOperation('AWS SNS connection verified');
        return this.success(true, 'AWS SNS connection verified');
      } else {
        return this.error('AWS SNS connection failed');
      }

    } catch (error) {
      this.logError('AWS SNS connection test failed', error);
      return this.error('Failed to verify AWS SNS connection');
    }
  }

  private async createSNSRequest(action: string, params: Record<string, any>): Promise<{ headers: Record<string, string>; body: string }> {
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0].replace(/-/g, '');
    
    // Create canonical request
    const queryParams = new URLSearchParams({
      Action: action,
      Version: '2010-03-31',
      ...params
    });

    const body = queryParams.toString();
    
    // Create signature (simplified version - in production use proper AWS SDK)
    const signature = await this.createAWSSignature(action, body, timestamp, date);

    return {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Amz-Date': timestamp.replace(/[-:]/g, '').split('.')[0] + 'Z',
        'Authorization': signature,
      },
      body
    };
  }

  private async createAWSSignature(action: string, body: string, timestamp: string, date: string): Promise<string> {
    // This is a simplified signature creation
    // In production, use the official AWS SDK or implement proper AWS Signature Version 4
    
    const region = this.config.region!;
    const service = 'sns';
    const accessKey = this.config.accessKeyId!;
    
    // For now, return a placeholder signature
    // You should implement proper AWS Signature Version 4 here
    return `AWS4-HMAC-SHA256 Credential=${accessKey}/${date}/${region}/${service}/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=placeholder`;
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
