/**
 * BulkSMS Provider Implementation
 */

import { ISMSService, SMSData, ServiceResponse } from '../../../interfaces/services';
import { SMSProviderConfig } from '../../../config/providers';
import { prisma } from '../../../config/database';
import axios from 'axios';

export class BulkSMSProvider implements ISMSService {
  private config: SMSProviderConfig;
  private baseUrl: string = 'https://smslogin.co/v3/api.php';

  constructor(config: SMSProviderConfig) {
    this.config = config;
  }

  // Helper methods for creating responses
  private success<T>(data: T, message?: string): ServiceResponse<T> {
    return {
      success: true,
      data,
      message: message || 'Operation completed successfully'
    };
  }

  private error(message: string): ServiceResponse<any> {
    return {
      success: false,
      message,
      data: null
    };
  }

  async sendSMS(data: SMSData): Promise<ServiceResponse<{ messageId: string }>> {
    try {
      if (!this.config.username || !this.config.apiKey || !this.config.senderId) {
        const missingFields = [];
        if (!this.config.username) missingFields.push('username');
        if (!this.config.apiKey) missingFields.push('apiKey');
        if (!this.config.senderId) missingFields.push('senderId');

        console.error('❌ BulkSMS configuration incomplete. Missing:', missingFields.join(', '));
        return this.error(`BulkSMS configuration incomplete. Missing: ${missingFields.join(', ')}`);
      }

      const { to, message, templateData } = data;

      // Clean phone number - remove any non-digit characters except +
      const cleanPhoneNumber = to.replace(/[^\d+]/g, '');

      // Remove country code if present (assuming Indian numbers)
      const mobileNumber = cleanPhoneNumber.startsWith('+91')
        ? cleanPhoneNumber.substring(3)
        : cleanPhoneNumber.startsWith('91') && cleanPhoneNumber.length > 10
        ? cleanPhoneNumber.substring(2)
        : cleanPhoneNumber;

      // Validate mobile number (should be 10 digits for Indian numbers)
      if (!/^\d{10}$/.test(mobileNumber)) {
        return this.error(`Invalid mobile number format: ${mobileNumber}. Expected 10 digits.`);
      }

      // Prepare API parameters
      const params = new URLSearchParams({
        username: this.config.username!,
        apikey: this.config.apiKey!,
        senderid: this.config.senderId!,
        mobile: mobileNumber,
        message: message, // Use 'message' parameter for BulkSMS API
      });

      // Add template ID if provided from templateData
      if (templateData?.templateId && templateData.templateId.trim()) {
        params.append('templateid', templateData.templateId.trim());
      }

      const url = `${this.baseUrl}?${params.toString()}`;

      console.log('BulkSMS API Request:', {
        url: this.baseUrl,
        params: Object.fromEntries(params.entries()),
        mobile: mobileNumber,
        messageLength: message.length
      });

      const response = await axios.get(url, {
        timeout: 30000, // 30 seconds timeout
        headers: {
          'User-Agent': 'CutQ-SMS-Service/1.0',
          'Accept': 'application/json, text/plain, */*'
        }
      });

      console.log('BulkSMS API Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });

      // BulkSMS typically returns text response
      const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

      // Check for success indicators in response
      const isSuccess = response.status === 200 && (
        responseText.toLowerCase().includes('success') ||
        responseText.toLowerCase().includes('sent') ||
        responseText.toLowerCase().includes('delivered') ||
        responseText.toLowerCase().includes('credits') || // BulkSMS returns credits on success
        responseText.toLowerCase().includes('campid') || // BulkSMS returns campid on successful SMS
        /^\d+$/.test(responseText.trim()) || // Message ID (numeric)
        responseText.includes('"Credits"') || // JSON response with credits
        responseText.includes("'campid'") // Campaign ID in single quotes
      );

      if (isSuccess) {
        console.log('✅ BulkSMS SMS sent successfully');
        console.log('📱 API Response:', responseText);
        return this.success({ messageId: responseText.trim() });
      } else {
        console.log('❌ BulkSMS SMS failed');
        console.log('📱 API Response:', responseText);
        return this.error(`BulkSMS API Error: ${responseText}`);
      }

    } catch (error: any) {
      console.error('❌ BulkSMS Provider Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        phoneNumber: data.to,
        config: {
          hasUsername: !!this.config.username,
          hasApiKey: !!this.config.apiKey,
          hasSenderId: !!this.config.senderId,
          baseUrl: this.baseUrl
        }
      });

      // Provide more specific error messages
      if (error.code === 'ENOTFOUND') {
        return this.error('BulkSMS API server not reachable. Please check your internet connection.');
      } else if (error.code === 'ETIMEDOUT') {
        return this.error('BulkSMS API request timed out. Please try again.');
      } else if (error.response?.status === 401) {
        return this.error('BulkSMS authentication failed. Please check your username and API key.');
      } else if (error.response?.status === 403) {
        return this.error('BulkSMS access forbidden. Please check your account permissions.');
      } else {
        return this.error(`BulkSMS Error: ${error.message}`);
      }
    }
  }

  async sendTemplate(templateName: string, to: string, data: Record<string, any>): Promise<ServiceResponse<{ messageId: string }>> {
    let template: string;
    let templateId: string | undefined;

    // Get template from system config for OTP
    if (templateName === 'otp') {
      try {
        const config = await prisma.systemConfig.findUnique({
          where: { key: 'sms_template_otp' }
        });

        if (config?.value) {
          // Parse the template configuration
          const templateConfig = JSON.parse(config.value);

          // Handle different template formats
          if (Array.isArray(templateConfig)) {
            // Array format: use first template
            if (templateConfig.length > 0) {
              template = templateConfig[0].message;
              templateId = templateConfig[0].templateId;
              console.log('📋 Using admin-configured SMS template (array format):', template);
            } else {
              template = this.getTemplates()[templateName];
            }
          } else if (templateConfig.options && templateConfig.options.length > 0) {
            // Object format with options
            const activeTemplate = templateConfig.options.find((opt: any) => opt.id === templateConfig.defaultValue) || templateConfig.options[0];
            template = activeTemplate.message;
            templateId = activeTemplate.templateId;
            console.log('📋 Using admin-configured SMS template (object format):', template);
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

    // Replace template variables with actual data
    let message = template;

    // Replace {#var#} placeholders with actual values
    if (data.otp) {
      message = message.replace('{#var#}', data.otp);
    }
    if (data.expiresIn) {
      message = message.replace('{#var#}', data.expiresIn.toString());
    }

    // Replace any remaining {#var#} with empty string or default values
    message = message.replace(/{#var#}/g, '');

    console.log('📱 Final SMS message:', message);

    // Send SMS with the processed template
    return this.sendSMS({
      to,
      message,
      templateData: templateId ? { templateId } : undefined
    });
  }

  private getTemplates(): Record<string, string> {
    return {
      otp: 'Your CutQ verification code is {#var#}. Valid for {#var#} minutes. Do not share this code with anyone. Powered by - gem infinity',
      welcome: 'Welcome to CutQ! Your account has been created successfully.',
      booking_confirmation: 'Your booking at {#var#} on {#var#} at {#var#} has been confirmed. Booking ID: {#var#}',
      booking_reminder: 'Reminder: You have a booking at {#var#} tomorrow at {#var#}. Booking ID: {#var#}',
      password_reset: 'Your CutQ password reset code is {#var#}. Valid for {#var#} minutes.',
    };
  }

  async verifyConnection(): Promise<ServiceResponse<boolean>> {
    try {
      if (!this.config.username || !this.config.apiKey || !this.config.senderId) {
        return this.error('BulkSMS configuration incomplete');
      }

      // Test connection by making a simple API call
      // We'll use a test message to a dummy number to verify credentials
      const params = new URLSearchParams({
        username: this.config.username,
        apikey: this.config.apiKey,
        senderid: this.config.senderId,
        mobile: '9999999999', // Test number
        message: 'Test connection'
      });

      const url = `${this.baseUrl}?${params.toString()}`;

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'CutQ-SMS-Service/1.0',
          'Accept': 'application/json, text/plain, */*'
        }
      });

      // If we get a response (even if it's an error about the test number),
      // it means the credentials are valid
      return this.success(true);

    } catch (error: any) {
      console.error('BulkSMS Connection Verification Error:', error.message);
      return this.error(`Connection verification failed: ${error.message}`);
    }
  }
}
