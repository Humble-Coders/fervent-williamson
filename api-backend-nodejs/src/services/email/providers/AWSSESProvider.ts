/**
 * AWS SES Email Provider Implementation
 */

import { BaseService } from '../../../core/BaseService';
import { IEmailService, EmailData, ServiceResponse } from '../../../interfaces/services';
import { EmailProviderConfig } from '../../../config/providers';

export class AWSSESProvider extends BaseService implements IEmailService {
  private config: EmailProviderConfig;

  constructor(config: EmailProviderConfig) {
    super();
    this.config = config;
  }

  async sendEmail(data: EmailData): Promise<ServiceResponse<{ messageId: string }>> {
    try {
      if (!this.config.region || !this.config.accessKeyId || !this.config.secretAccessKey) {
        return this.error('AWS SES configuration incomplete');
      }

      const { to, subject, html, text, attachments } = data;

      // Prepare email for AWS SES
      const emailData = {
        Source: `${this.config.fromName || 'Application'} <${this.config.fromEmail}>`,
        Destination: {
          ToAddresses: Array.isArray(to) ? to : [to]
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8'
          },
          Body: {
            ...(text && {
              Text: {
                Data: text,
                Charset: 'UTF-8'
              }
            }),
            ...(html && {
              Html: {
                Data: html,
                Charset: 'UTF-8'
              }
            })
          }
        }
      };

      // For attachments, we need to use SendRawEmail
      if (attachments && attachments.length > 0) {
        return this.sendRawEmail(data);
      }

      const sesRequest = await this.createSESRequest('SendEmail', emailData);

      const response = await fetch(`https://email.${this.config.region}.amazonaws.com/`, {
        method: 'POST',
        headers: sesRequest.headers,
        body: sesRequest.body
      });

      const responseText = await response.text();

      if (!response.ok) {
        this.logError('AWS SES send failed', { status: response.status, response: responseText });
        return this.error(`AWS SES error: ${response.statusText}`);
      }

      // Parse XML response to get MessageId
      const messageIdMatch = responseText.match(/<MessageId>([^<]+)<\/MessageId>/);
      const messageId = messageIdMatch ? messageIdMatch[1] : `aws_ses_${Date.now()}`;

      this.logOperation('Email sent via AWS SES', { 
        to: Array.isArray(to) ? to : [to], 
        subject, 
        messageId 
      });

      return this.success({ messageId });

    } catch (error) {
      this.logError('AWS SES send error', error);
      return this.error('Failed to send email via AWS SES');
    }
  }

  async sendTemplate(templateName: string, to: string, data: Record<string, any>): Promise<ServiceResponse<{ messageId: string }>> {
    const templates = this.getTemplates();
    const template = templates[templateName];
    
    if (!template) {
      return this.error(`Template '${templateName}' not found`);
    }

    // Replace template variables
    let subject = template.subject;
    let html = template.html;
    let text = template.text;

    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, String(value));
      html = html.replace(regex, String(value));
      if (text) {
        text = text.replace(regex, String(value));
      }
    }

    return this.sendEmail({ to, subject, html, text });
  }

  async verifyConnection(): Promise<ServiceResponse<boolean>> {
    try {
      if (!this.config.region || !this.config.accessKeyId || !this.config.secretAccessKey) {
        return this.error('AWS SES configuration incomplete');
      }

      // Test connection by getting send quota
      const sesRequest = await this.createSESRequest('GetSendQuota', {});

      const response = await fetch(`https://email.${this.config.region}.amazonaws.com/`, {
        method: 'POST',
        headers: sesRequest.headers,
        body: sesRequest.body
      });

      if (response.ok) {
        const responseText = await response.text();
        this.logOperation('AWS SES connection verified', { region: this.config.region });
        return this.success(true, 'AWS SES connection verified');
      } else {
        return this.error('AWS SES connection failed');
      }

    } catch (error) {
      this.logError('AWS SES connection test failed', error);
      return this.error('Failed to verify AWS SES connection');
    }
  }

  private async sendRawEmail(data: EmailData): Promise<ServiceResponse<{ messageId: string }>> {
    // This is a simplified implementation for raw email with attachments
    // In production, you should use a proper MIME builder
    
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36)}`;
    let rawMessage = '';

    // Headers
    rawMessage += `From: ${this.config.fromName || 'Application'} <${this.config.fromEmail}>\r\n`;
    rawMessage += `To: ${Array.isArray(data.to) ? data.to.join(', ') : data.to}\r\n`;
    rawMessage += `Subject: ${data.subject}\r\n`;
    rawMessage += `MIME-Version: 1.0\r\n`;
    rawMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

    // Body
    rawMessage += `--${boundary}\r\n`;
    rawMessage += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
    rawMessage += `${data.html || data.text}\r\n\r\n`;

    // Attachments
    if (data.attachments) {
      for (const attachment of data.attachments) {
        rawMessage += `--${boundary}\r\n`;
        rawMessage += `Content-Type: ${attachment.contentType || 'application/octet-stream'}\r\n`;
        rawMessage += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
        rawMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
        
        const content = Buffer.isBuffer(attachment.content) 
          ? attachment.content.toString('base64')
          : Buffer.from(attachment.content).toString('base64');
        
        rawMessage += content + '\r\n\r\n';
      }
    }

    rawMessage += `--${boundary}--\r\n`;

    const emailData = {
      RawMessage: {
        Data: Buffer.from(rawMessage).toString('base64')
      }
    };

    const sesRequest = await this.createSESRequest('SendRawEmail', emailData);

    const response = await fetch(`https://email.${this.config.region}.amazonaws.com/`, {
      method: 'POST',
      headers: sesRequest.headers,
      body: sesRequest.body
    });

    const responseText = await response.text();

    if (!response.ok) {
      this.logError('AWS SES raw send failed', { status: response.status, response: responseText });
      return this.error(`AWS SES error: ${response.statusText}`);
    }

    const messageIdMatch = responseText.match(/<MessageId>([^<]+)<\/MessageId>/);
    const messageId = messageIdMatch ? messageIdMatch[1] : `aws_ses_raw_${Date.now()}`;

    return this.success({ messageId });
  }

  private async createSESRequest(action: string, params: Record<string, any>): Promise<{ headers: Record<string, string>; body: string }> {
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0].replace(/-/g, '');
    
    // Create form data
    const formData = new URLSearchParams({
      Action: action,
      Version: '2010-12-01',
      ...this.flattenParams(params)
    });

    const body = formData.toString();
    
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

  private flattenParams(params: any, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(params)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            Object.assign(result, this.flattenParams(item, `${fullKey}.member.${index + 1}`));
          } else {
            result[`${fullKey}.member.${index + 1}`] = String(item);
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        Object.assign(result, this.flattenParams(value, fullKey));
      } else {
        result[fullKey] = String(value);
      }
    }
    
    return result;
  }

  private async createAWSSignature(action: string, body: string, timestamp: string, date: string): Promise<string> {
    // This is a simplified signature creation
    // In production, use the official AWS SDK or implement proper AWS Signature Version 4
    
    const region = this.config.region!;
    const service = 'ses';
    const accessKey = this.config.accessKeyId!;
    
    // For now, return a placeholder signature
    // You should implement proper AWS Signature Version 4 here
    return `AWS4-HMAC-SHA256 Credential=${accessKey}/${date}/${region}/${service}/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=placeholder`;
  }

  private getTemplates(): Record<string, { subject: string; html: string; text?: string }> {
    return {
      otp: {
        subject: '{{appName}} - Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>{{appName}} Verification Code</h2>
            <p>Your verification code is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              {{otp}}
            </div>
            <p>This code will expire in {{expiresIn}} minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        `,
        text: 'Your {{appName}} verification code is {{otp}}. This code will expire in {{expiresIn}} minutes.'
      },
      welcome: {
        subject: 'Welcome to {{appName}}!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to {{appName}}!</h2>
            <p>Thank you for joining us. Your account has been created successfully.</p>
            <p>You can now start using all the features of {{appName}}.</p>
          </div>
        `,
        text: 'Welcome to {{appName}}! Your account has been created successfully.'
      },
      password_reset: {
        subject: '{{appName}} - Password Reset',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password. Use the code below:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              {{otp}}
            </div>
            <p>This code will expire in {{expiresIn}} minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
        text: 'Your {{appName}} password reset code is {{otp}}. This code will expire in {{expiresIn}} minutes.'
      }
    };
  }
}
