/**
 * SendGrid Email Provider Implementation
 */

import { BaseService } from '../../../core/BaseService';
import { IEmailService, EmailData, ServiceResponse } from '../../../interfaces/services';
import { EmailProviderConfig } from '../../../config/providers';

export class SendGridProvider extends BaseService implements IEmailService {
  private config: EmailProviderConfig;

  constructor(config: EmailProviderConfig) {
    super();
    this.config = config;
  }

  async sendEmail(data: EmailData): Promise<ServiceResponse<{ messageId: string }>> {
    try {
      if (!this.config.apiKey) {
        return this.error('SendGrid API key not configured');
      }

      const { to, subject, html, text, attachments } = data;

      // Prepare email data for SendGrid
      const emailData = {
        personalizations: [{
          to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
          subject
        }],
        from: {
          email: this.config.fromEmail!,
          name: this.config.fromName
        },
        content: [
          ...(text ? [{ type: 'text/plain', value: text }] : []),
          ...(html ? [{ type: 'text/html', value: html }] : [])
        ],
        ...(attachments && attachments.length > 0 ? {
          attachments: attachments.map(att => ({
            content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
            filename: att.filename,
            type: att.contentType || 'application/octet-stream'
          }))
        } : {})
      };

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logError('SendGrid send failed', { status: response.status, error: errorData });
        return this.error(`SendGrid error: ${response.statusText}`);
      }

      // SendGrid returns 202 with X-Message-Id header
      const messageId = response.headers.get('X-Message-Id') || `sendgrid_${Date.now()}`;

      this.logOperation('Email sent via SendGrid', { 
        to: Array.isArray(to) ? to : [to], 
        subject, 
        messageId 
      });

      return this.success({ messageId });

    } catch (error) {
      this.logError('SendGrid send error', error);
      return this.error('Failed to send email via SendGrid');
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
      if (!this.config.apiKey) {
        return this.error('SendGrid API key not configured');
      }

      // Test connection by getting user profile
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (response.ok) {
        const profile = await response.json() as { username?: string };
        this.logOperation('SendGrid connection verified', { username: profile.username || 'unknown' });
        return this.success(true, 'SendGrid connection verified');
      } else {
        return this.error('SendGrid connection failed');
      }

    } catch (error) {
      this.logError('SendGrid connection test failed', error);
      return this.error('Failed to verify SendGrid connection');
    }
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
            <hr>
            <p style="color: #666; font-size: 12px;">This is an automated message from {{appName}}.</p>
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
            <hr>
            <p style="color: #666; font-size: 12px;">This is an automated message from {{appName}}.</p>
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
            <hr>
            <p style="color: #666; font-size: 12px;">This is an automated message from {{appName}}.</p>
          </div>
        `,
        text: 'Your {{appName}} password reset code is {{otp}}. This code will expire in {{expiresIn}} minutes.'
      }
    };
  }
}
