/**
 * Universal OTP Service
 * Provider-agnostic OTP service with multiple SMS/Email providers
 */

import { BaseService } from '../../core/BaseService';
import { IOTPService, OTPData, ServiceResponse, ISMSService, IEmailService } from '../../interfaces/services';
import { getService } from '../../core/container';
import { appConfig } from '../../config/configLoader';

interface StoredOTP {
  otp: string;
  contact: string;
  type: 'email' | 'sms';
  purpose: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

export class OTPService extends BaseService implements IOTPService {
  private otpStore = new Map<string, StoredOTP>();
  private maxAttempts = 3;
  private defaultExpiryMinutes = 5;

  constructor() {
    super();
    this.startCleanupTimer();
  }

  /**
   * Generate OTP
   */
  generateOTP(length: number = 6): string {
    // In development mode, return static OTP if configured
    if (this.isDevelopment() && process.env.STATIC_OTP) {
      return process.env.STATIC_OTP;
    }

    return this.generateNumericOTP(length);
  }

  /**
   * Send OTP via SMS or Email
   */
  async sendOTP(data: OTPData): Promise<ServiceResponse<{ otp?: string; isDevelopmentMode?: boolean }>> {
    try {
      // Validate input
      const validation = this.validateOTPData(data);
      if (!validation.isValid) {
        return this.error(validation.message!);
      }

      const { contact, type, purpose, expiresIn = this.defaultExpiryMinutes } = data;
      
      // Generate OTP
      const otp = data.otp || this.generateOTP();
      
      // Check if feature is enabled
      if (type === 'email' && !appConfig.features.emailVerification) {
        return this.error('Email verification is disabled');
      }
      
      if (type === 'sms' && !appConfig.features.smsVerification) {
        return this.error('SMS verification is disabled');
      }

      // Store OTP
      const key = this.getOTPKey(contact, purpose);
      const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);
      
      this.otpStore.set(key, {
        otp,
        contact,
        type,
        purpose,
        expiresAt,
        attempts: 0,
        createdAt: new Date()
      });

      // Send OTP
      let sendResult: ServiceResponse<any>;
      
      if (type === 'email') {
        const emailService = getService<IEmailService>('emailService');
        sendResult = await emailService.sendTemplate('otp', contact, { 
          otp, 
          purpose,
          expiresIn,
          appName: appConfig.app.name 
        });
      } else {
        const smsService = getService<ISMSService>('smsService');
        sendResult = await smsService.sendTemplate('otp', contact, { 
          otp, 
          purpose,
          expiresIn,
          appName: appConfig.app.name 
        });
      }

      if (!sendResult.success) {
        // Remove from store if sending failed
        this.otpStore.delete(key);
        return this.error(`Failed to send OTP: ${sendResult.message}`);
      }

      this.logOperation('OTP sent', { contact, type, purpose });

      // Return response (include OTP in development mode)
      const response: any = {
        message: `OTP sent successfully to ${contact}`
      };

      if (this.isDevelopment()) {
        response.otp = otp;
        response.isDevelopmentMode = true;
      }

      return this.success(response);

    } catch (error) {
      this.logError('Send OTP', error);
      return this.error('Failed to send OTP');
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(contact: string, otp: string, purpose: string = 'verification'): Promise<ServiceResponse<boolean>> {
    try {
      const key = this.getOTPKey(contact, purpose);
      const storedOTP = this.otpStore.get(key);

      if (!storedOTP) {
        return this.error('OTP not found or expired');
      }

      // Check expiry
      if (new Date() > storedOTP.expiresAt) {
        this.otpStore.delete(key);
        return this.error('OTP has expired');
      }

      // Check attempts
      if (storedOTP.attempts >= this.maxAttempts) {
        this.otpStore.delete(key);
        return this.error('Maximum verification attempts exceeded');
      }

      // Increment attempts
      storedOTP.attempts++;

      // Verify OTP
      if (storedOTP.otp !== otp) {
        return this.error('Invalid OTP');
      }

      // Success - remove from store
      this.otpStore.delete(key);
      
      this.logOperation('OTP verified', { contact, purpose });
      return this.success(true, 'OTP verified successfully');

    } catch (error) {
      this.logError('Verify OTP', error);
      return this.error('Failed to verify OTP');
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(contact: string, type: 'email' | 'sms', purpose: 'verification' | 'login' | 'password_reset' = 'verification'): Promise<ServiceResponse<void>> {
    try {
      // Remove existing OTP
      const key = this.getOTPKey(contact, purpose);
      this.otpStore.delete(key);

      // Send new OTP
      const result = await this.sendOTP({ contact, type, purpose: purpose as 'verification' | 'login' | 'password_reset' });
      
      if (!result.success) {
        return this.error(result.message);
      }

      return this.success(undefined, 'OTP resent successfully');

    } catch (error) {
      this.logError('Resend OTP', error);
      return this.error('Failed to resend OTP');
    }
  }

  /**
   * Clean up expired OTPs
   */
  async cleanupExpiredOTPs(): Promise<void> {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, otp] of this.otpStore) {
      if (now > otp.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.otpStore.delete(key);
    }

    if (expiredKeys.length > 0) {
      this.logOperation('Cleaned up expired OTPs', { count: expiredKeys.length });
    }
  }

  /**
   * Get OTP statistics (for monitoring)
   */
  getStats(): {
    totalStored: number;
    byType: Record<string, number>;
    byPurpose: Record<string, number>;
  } {
    const stats = {
      totalStored: this.otpStore.size,
      byType: {} as Record<string, number>,
      byPurpose: {} as Record<string, number>
    };

    for (const otp of this.otpStore.values()) {
      stats.byType[otp.type] = (stats.byType[otp.type] || 0) + 1;
      stats.byPurpose[otp.purpose] = (stats.byPurpose[otp.purpose] || 0) + 1;
    }

    return stats;
  }

  // Private methods

  private getOTPKey(contact: string, purpose: string): string {
    return `${contact}:${purpose}`;
  }

  private validateOTPData(data: OTPData): { isValid: boolean; message?: string } {
    const { contact, type, purpose } = data;

    if (!contact) {
      return { isValid: false, message: 'Contact is required' };
    }

    if (!type || !['email', 'sms'].includes(type)) {
      return { isValid: false, message: 'Type must be email or sms' };
    }

    if (!purpose) {
      return { isValid: false, message: 'Purpose is required' };
    }

    if (type === 'email' && !this.isValidEmail(contact)) {
      return { isValid: false, message: 'Invalid email format' };
    }

    if (type === 'sms' && !this.isValidPhone(contact)) {
      return { isValid: false, message: 'Invalid phone format' };
    }

    return { isValid: true };
  }

  private startCleanupTimer(): void {
    // Clean up expired OTPs every 5 minutes
    setInterval(() => {
      this.cleanupExpiredOTPs();
    }, 5 * 60 * 1000);
  }
}
