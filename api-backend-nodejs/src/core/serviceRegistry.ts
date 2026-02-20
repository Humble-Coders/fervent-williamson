/**
 * Service Registry
 * Registers all services with the dependency injection container
 */

import { container, Services } from './container';
import { appConfig } from '../config/configLoader';
import { logger } from '../config/logger';

// Services
import { OTPService } from '../services/otp/OTPService';
import { SMSServiceFactory } from '../services/sms/SMSServiceFactory';
import { EmailServiceFactory } from '../services/email/EmailServiceFactory';

// Interfaces
import { ILogger, IOTPService, ISMSService, IEmailService } from '../interfaces/services';

/**
 * Logger wrapper to implement ILogger interface
 */
class LoggerWrapper implements ILogger {
  info(message: string, meta?: any): void {
    logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    logger.warn(message, meta);
  }

  error(message: string, meta?: any): void {
    logger.error(message, meta);
  }

  debug(message: string, meta?: any): void {
    logger.debug(message, meta);
  }
}

/**
 * Register all services with the container
 */
export function registerServices(): void {
  try {
    // Register logger first (required by other services)
    container.instance<ILogger>(Services.LOGGER, new LoggerWrapper());

    // Register SMS service
    const smsConfig = appConfig.sms;
    const smsValidation = SMSServiceFactory.validateConfig(smsConfig);
    
    if (smsValidation.isValid) {
      const smsService = SMSServiceFactory.create(smsConfig);
      container.instance<ISMSService>(Services.SMS, smsService);
      logger.info('SMS service registered', { provider: smsConfig.provider });
    } else {
      logger.warn('SMS service not registered due to configuration errors', { 
        errors: smsValidation.errors 
      });
      // Register a mock SMS service for development
      container.instance<ISMSService>(Services.SMS, new MockSMSService());
    }

    // Register Email service
    const emailConfig = appConfig.email;
    const emailValidation = EmailServiceFactory.validateConfig(emailConfig);
    
    if (emailValidation.isValid) {
      const emailService = EmailServiceFactory.create(emailConfig);
      container.instance<IEmailService>(Services.EMAIL, emailService);
      logger.info('Email service registered', { provider: emailConfig.provider });
    } else {
      logger.warn('Email service not registered due to configuration errors', { 
        errors: emailValidation.errors 
      });
      // Register a mock email service for development
      container.instance<IEmailService>(Services.EMAIL, new MockEmailService());
    }

    // Register OTP service (depends on SMS and Email services)
    container.singleton<IOTPService>(Services.OTP, OTPService);
    logger.info('OTP service registered');

    // Verify service registrations
    verifyServiceRegistrations();

    logger.info('All services registered successfully');

  } catch (error) {
    logger.error('Failed to register services', { error });
    throw error;
  }
}

/**
 * Verify that all required services are registered
 */
function verifyServiceRegistrations(): void {
  const requiredServices = [
    Services.LOGGER,
    Services.SMS,
    Services.EMAIL,
    Services.OTP
  ];

  const missingServices: string[] = [];

  for (const serviceName of requiredServices) {
    if (!container.has(serviceName)) {
      missingServices.push(serviceName);
    }
  }

  if (missingServices.length > 0) {
    throw new Error(`Missing required services: ${missingServices.join(', ')}`);
  }
}

/**
 * Get service registration status
 */
export function getServiceStatus(): Record<string, { registered: boolean; provider?: string; status?: string }> {
  const status: Record<string, { registered: boolean; provider?: string; status?: string }> = {};

  // Check each service
  const services = [
    { name: Services.LOGGER, provider: 'winston' },
    { name: Services.SMS, provider: appConfig.sms.provider },
    { name: Services.EMAIL, provider: appConfig.email.provider },
    { name: Services.OTP, provider: 'internal' }
  ];

  for (const service of services) {
    status[service.name] = {
      registered: container.has(service.name),
      provider: service.provider
    };

    if (status[service.name].registered) {
      try {
        const serviceInstance = container.resolve(service.name);
        status[service.name].status = 'healthy';
      } catch (error) {
        status[service.name].status = 'error';
      }
    } else {
      status[service.name].status = 'not_registered';
    }
  }

  return status;
}

/**
 * Test all service connections
 */
export async function testServiceConnections(): Promise<Record<string, { success: boolean; message: string }>> {
  const results: Record<string, { success: boolean; message: string }> = {};

  // Test SMS service
  try {
    if (container.has(Services.SMS)) {
      const smsService = container.resolve<ISMSService>(Services.SMS);
      const result = await smsService.verifyConnection();
      results.sms = { success: result.success, message: result.message };
    } else {
      results.sms = { success: false, message: 'SMS service not registered' };
    }
  } catch (error) {
    results.sms = { success: false, message: `SMS test failed: ${error}` };
  }

  // Test Email service
  try {
    if (container.has(Services.EMAIL)) {
      const emailService = container.resolve<IEmailService>(Services.EMAIL);
      const result = await emailService.verifyConnection();
      results.email = { success: result.success, message: result.message };
    } else {
      results.email = { success: false, message: 'Email service not registered' };
    }
  } catch (error) {
    results.email = { success: false, message: `Email test failed: ${error}` };
  }

  return results;
}

// Mock services for development/testing

class MockSMSService implements ISMSService {
  async sendSMS(data: any): Promise<any> {
    console.log('Mock SMS:', data);
    return { success: true, data: { messageId: 'mock_sms_' + Date.now() } };
  }

  async sendTemplate(templateName: string, to: string, data: any): Promise<any> {
    console.log('Mock SMS Template:', { templateName, to, data });
    return { success: true, data: { messageId: 'mock_sms_template_' + Date.now() } };
  }

  async verifyConnection(): Promise<any> {
    return { success: true, message: 'Mock SMS service (development mode)' };
  }
}

class MockEmailService implements IEmailService {
  async sendEmail(data: any): Promise<any> {
    console.log('Mock Email:', data);
    return { success: true, data: { messageId: 'mock_email_' + Date.now() } };
  }

  async sendTemplate(templateName: string, to: string, data: any): Promise<any> {
    console.log('Mock Email Template:', { templateName, to, data });
    return { success: true, data: { messageId: 'mock_email_template_' + Date.now() } };
  }

  async verifyConnection(): Promise<any> {
    return { success: true, message: 'Mock Email service (development mode)' };
  }
}
