/**
 * SMTP Email Provider Implementation (including Outlook)
 */

import { BaseService } from '../../../core/BaseService';
import { IEmailService, EmailData, ServiceResponse } from '../../../interfaces/services';
import { EmailProviderConfig } from '../../../config/providers';

export class SMTPProvider extends BaseService implements IEmailService {
  private config: EmailProviderConfig;

  constructor(config: EmailProviderConfig) {
    super();
    this.config = config;
  }

  async sendEmail(data: EmailData): Promise<ServiceResponse<{ messageId: string }>> {
    try {
      if (!this.config.host || !this.config.user || !this.config.pass) {
        return this.error('SMTP configuration incomplete');
      }

      // In development mode, just log the email
      if (this.isDevelopment()) {
        this.logger.info('SMTP Email (Development Mode)', {
          to: data.to,
          subject: data.subject,
          html: data.html?.substring(0, 100) + '...',
          text: data.text?.substring(0, 100) + '...'
        });

        return this.success({
          messageId: `smtp_dev_${Date.now()}`
        }, 'Email sent successfully (development mode)');
      }

      // Use nodemailer for SMTP
      const nodemailer = require('nodemailer');

      const transporter = nodemailer.createTransporter({
        host: this.config.host,
        port: this.config.port || 587,
        secure: this.config.secure || false,
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
        // For Outlook/Office365
        ...(this.config.host.includes('outlook') && {
          tls: {
            ciphers: 'SSLv3'
          }
        })
      });

      const mailOptions = {
        from: `${this.config.fromName || 'Application'} <${this.config.fromEmail || this.config.user}>`,
        to: Array.isArray(data.to) ? data.to.join(', ') : data.to,
        subject: data.subject,
        text: data.text,
        html: data.html,
        attachments: data.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      };

      const result = await transporter.sendMail(mailOptions);

      this.logOperation('Email sent via SMTP', { 
        to: data.to, 
        subject: data.subject, 
        messageId: result.messageId,
        host: this.config.host
      });

      return this.success({ messageId: result.messageId });

    } catch (error) {
      this.logError('SMTP send error', error);
      return this.error('Failed to send email via SMTP');
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
      if (!this.config.host || !this.config.user || !this.config.pass) {
        return this.error('SMTP configuration incomplete');
      }

      if (this.isDevelopment()) {
        return this.success(true, 'SMTP connection verified (development mode)');
      }

      const nodemailer = require('nodemailer');

      const transporter = nodemailer.createTransporter({
        host: this.config.host,
        port: this.config.port || 587,
        secure: this.config.secure || false,
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
        ...(this.config.host.includes('outlook') && {
          tls: {
            ciphers: 'SSLv3'
          }
        })
      });

      await transporter.verify();

      this.logOperation('SMTP connection verified', { host: this.config.host });
      return this.success(true, 'SMTP connection verified');

    } catch (error) {
      this.logError('SMTP connection test failed', error);
      return this.error('Failed to verify SMTP connection');
    }
  }

  private getTemplates(): Record<string, { subject: string; html: string; text?: string }> {
    return {
      otp: {
        subject: '{{appName}} - Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin: 0;">{{appName}}</h1>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center;">
              <h2 style="color: #333; margin-top: 0;">Verification Code</h2>
              <p style="color: #666; margin-bottom: 30px;">Enter this code to verify your account:</p>
              
              <div style="background: white; border: 2px solid #007bff; border-radius: 8px; padding: 20px; margin: 20px 0; display: inline-block;">
                <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px;">{{otp}}</span>
              </div>
              
              <p style="color: #666; margin-top: 30px;">This code will expire in {{expiresIn}} minutes.</p>
              <p style="color: #999; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This is an automated message from {{appName}}. Please do not reply to this email.
              </p>
            </div>
          </div>
        `,
        text: 'Your {{appName}} verification code is {{otp}}. This code will expire in {{expiresIn}} minutes. If you didn\'t request this code, please ignore this email.'
      },
      welcome: {
        subject: 'Welcome to {{appName}}!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin: 0;">Welcome to {{appName}}!</h1>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 30px;">
              <h2 style="color: #28a745; margin-top: 0;">Account Created Successfully</h2>
              <p style="color: #666; line-height: 1.6;">
                Thank you for joining {{appName}}! Your account has been created and you're ready to get started.
              </p>
              <p style="color: #666; line-height: 1.6;">
                You can now access all the features and start exploring what {{appName}} has to offer.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This is an automated message from {{appName}}.
              </p>
            </div>
          </div>
        `,
        text: 'Welcome to {{appName}}! Your account has been created successfully and you can now start using all the features.'
      },
      password_reset: {
        subject: '{{appName}} - Password Reset Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin: 0;">{{appName}}</h1>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 30px;">
              <h2 style="color: #856404; margin-top: 0;">Password Reset Request</h2>
              <p style="color: #856404; line-height: 1.6;">
                You requested to reset your password. Use the code below to proceed:
              </p>
              
              <div style="background: white; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <span style="font-size: 32px; font-weight: bold; color: #ffc107; letter-spacing: 8px;">{{otp}}</span>
              </div>
              
              <p style="color: #856404; margin-top: 30px;">This code will expire in {{expiresIn}} minutes.</p>
              <p style="color: #6c757d; font-size: 14px;">If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This is an automated message from {{appName}}. Please do not reply to this email.
              </p>
            </div>
          </div>
        `,
        text: 'Password reset requested for {{appName}}. Your reset code is {{otp}}. This code will expire in {{expiresIn}} minutes. If you didn\'t request this, please ignore this email.'
      }
    };
  }
}
