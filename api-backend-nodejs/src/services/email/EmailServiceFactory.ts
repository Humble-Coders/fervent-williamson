/**
 * Email Service Factory
 * Creates email service instances based on configuration
 */

import { IEmailService } from '../../interfaces/services';
import { EmailProviderConfig } from '../../config/providers';
import { SendGridProvider } from './providers/SendGridProvider';
import { SMTPProvider } from './providers/SMTPProvider';
import { AWSSESProvider } from './providers/AWSSESProvider';

export class EmailServiceFactory {
  static create(config: EmailProviderConfig): IEmailService {
    switch (config.provider) {
      case 'sendgrid':
        return new SendGridProvider(config);
      
      case 'smtp':
      case 'outlook':
        return new SMTPProvider(config);
      
      case 'aws-ses':
        return new AWSSESProvider(config);
      
      default:
        throw new Error(`Unsupported email provider: ${config.provider}`);
    }
  }

  static getSupportedProviders(): string[] {
    return ['sendgrid', 'smtp', 'outlook', 'aws-ses'];
  }

  static validateConfig(config: EmailProviderConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.provider) {
      errors.push('Email provider is required');
      return { isValid: false, errors };
    }

    // Common validations
    if (!config.fromEmail) {
      errors.push('From email is required');
    }

    switch (config.provider) {
      case 'sendgrid':
        if (!config.apiKey) {
          errors.push('SendGrid API key is required');
        }
        break;

      case 'smtp':
      case 'outlook':
        if (!config.host) {
          errors.push('SMTP host is required');
        }
        if (!config.user) {
          errors.push('SMTP user is required');
        }
        if (!config.pass) {
          errors.push('SMTP password is required');
        }
        if (config.port && (config.port < 1 || config.port > 65535)) {
          errors.push('SMTP port must be between 1 and 65535');
        }
        break;

      case 'aws-ses':
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

      default:
        errors.push(`Unsupported email provider: ${config.provider}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static getProviderInfo(provider: string): { name: string; description: string; features: string[] } {
    const providers = {
      sendgrid: {
        name: 'SendGrid',
        description: 'Cloud-based email delivery service with high deliverability',
        features: ['High deliverability', 'Analytics', 'Template engine', 'Webhooks']
      },
      smtp: {
        name: 'SMTP',
        description: 'Standard SMTP protocol for email sending',
        features: ['Universal compatibility', 'Custom server support', 'Flexible configuration']
      },
      outlook: {
        name: 'Outlook/Office365',
        description: 'Microsoft Outlook/Office365 SMTP service',
        features: ['Microsoft integration', 'Enterprise features', 'High security']
      },
      'aws-ses': {
        name: 'AWS SES',
        description: 'Amazon Simple Email Service for scalable email sending',
        features: ['AWS integration', 'Cost-effective', 'High volume support', 'Bounce handling']
      }
    };

    return providers[provider as keyof typeof providers] || {
      name: 'Unknown',
      description: 'Unknown email provider',
      features: []
    };
  }

  static getRecommendedProvider(requirements: {
    volume?: 'low' | 'medium' | 'high';
    budget?: 'low' | 'medium' | 'high';
    features?: string[];
    integration?: 'aws' | 'microsoft' | 'google' | 'none';
  }): string {
    const { volume = 'medium', budget = 'medium', integration = 'none' } = requirements;

    // AWS integration
    if (integration === 'aws') {
      return 'aws-ses';
    }

    // Microsoft integration
    if (integration === 'microsoft') {
      return 'outlook';
    }

    // High volume
    if (volume === 'high') {
      return budget === 'high' ? 'sendgrid' : 'aws-ses';
    }

    // Low budget
    if (budget === 'low') {
      return 'smtp';
    }

    // Default recommendation
    return 'sendgrid';
  }
}
