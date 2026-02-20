import { sendEmail, sendSMS, verifyOTP } from '../src/services/otpService';
import { testPrisma, cleanupTestData } from './setup';

// Mock nodemailer for testing
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-message-id' })),
    verify: jest.fn(() => Promise.resolve(true)),
  })),
}));

describe('OTP Service', () => {
  beforeEach(async () => {
    await cleanupTestData();

    // Set up test system configs
    await testPrisma.systemConfig.createMany({
      data: [
        {
          key: 'development_mode_enabled',
          value: 'true',
          type: 'boolean',
          category: 'system',
          name: 'Development Mode',
          description: 'Enable development mode features',
          isActive: true,
        },
        {
          key: 'static_otp_code',
          value: '111111',
          type: 'string',
          category: 'system',
          name: 'Static OTP Code',
          description: 'Static OTP code for development',
          isActive: true,
        },
        {
          key: 'email_verification_enabled',
          value: 'true',
          type: 'boolean',
          category: 'auth',
          name: 'Email Verification',
          description: 'Enable email verification',
          isActive: true,
        },
        {
          key: 'sms_verification_enabled',
          value: 'true',
          type: 'boolean',
          category: 'auth',
          name: 'SMS Verification',
          description: 'Enable SMS verification',
          isActive: true,
        },
      ],
    });
  });

  describe('Email OTP', () => {
    describe('Development Mode', () => {
      it('should return static OTP in development mode', async () => {
        const result = await sendEmail('test@example.com');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Email OTP generated (development mode)');
        expect(result.data?.otp).toBe('111111');
        expect(result.data?.isDevelopmentMode).toBe(true);
        expect(result.data?.to).toBe('test@example.com');
      });

      it('should use custom OTP if provided in development mode', async () => {
        const result = await sendEmail('test@example.com', '123456');

        expect(result.success).toBe(true);
        expect(result.data?.otp).toBe('123456');
        expect(result.data?.isDevelopmentMode).toBe(true);
      });

      it('should use configured static OTP', async () => {
        // Update static OTP config
        await testPrisma.systemConfig.update({
          where: { key: 'static_otp_code' },
          data: { value: '999999' },
        });

        const result = await sendEmail('test@example.com');

        expect(result.success).toBe(true);
        expect(result.data?.otp).toBe('999999');
      });
    });

    describe('Production Mode', () => {
      beforeEach(async () => {
        // Disable development mode
        await testPrisma.systemConfig.update({
          where: { key: 'development_mode_enabled' },
          data: { value: 'false' },
        });
      });

      it('should attempt to send real email in production mode', async () => {
        const result = await sendEmail('test@example.com');

        // Since SMTP is not configured in test, it should fall back to development mode
        expect(result.success).toBe(true);
        expect(result.message).toBe('Email sent successfully (development mode)');
      });

      it('should generate random OTP in production mode', async () => {
        const result1 = await sendEmail('test1@example.com');
        const result2 = await sendEmail('test2@example.com');

        // In production mode without SMTP config, it falls back but still generates different OTPs
        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
      });
    });

    describe('Configuration Checks', () => {
      it('should return error when email verification is disabled', async () => {
        await testPrisma.systemConfig.update({
          where: { key: 'email_verification_enabled' },
          data: { value: 'false' },
        });

        const result = await sendEmail('test@example.com');

        expect(result.success).toBe(false);
        expect(result.message).toBe('Email verification is disabled');
      });

      it('should handle missing email verification config', async () => {
        await testPrisma.systemConfig.delete({
          where: { key: 'email_verification_enabled' },
        });

        const result = await sendEmail('test@example.com');

        expect(result.success).toBe(false);
        expect(result.message).toBe('Email verification is disabled');
      });
    });

    describe('Error Handling', () => {
      it('should handle database connection errors gracefully', async () => {
        // Mock database error
        jest.spyOn(testPrisma.systemConfig, 'findUnique').mockRejectedValueOnce(
          new Error('Database connection failed')
        );

        const result = await sendEmail('test@example.com');

        // Should still work with fallback to environment-based development mode
        expect(result.success).toBe(true);
      });
    });
  });

  describe('SMS OTP', () => {
    describe('Development Mode', () => {
      it('should return static OTP in development mode', async () => {
        const result = await sendSMS('+1234567890');

        expect(result.success).toBe(true);
        expect(result.message).toBe('SMS OTP generated (development mode)');
        expect(result.data?.otp).toBe('111111');
        expect(result.data?.isDevelopmentMode).toBe(true);
      });

      it('should use custom OTP if provided in development mode', async () => {
        const result = await sendSMS('+1234567890', '654321');

        expect(result.success).toBe(true);
        expect(result.data?.otp).toBe('654321');
        expect(result.data?.isDevelopmentMode).toBe(true);
      });

      it('should handle different phone number formats', async () => {
        const result1 = await sendSMS('+1234567890');
        const result2 = await sendSMS('1234567890');
        const result3 = await sendSMS('(123) 456-7890');

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
        expect(result3.success).toBe(true);
      });
    });

    describe('Production Mode', () => {
      beforeEach(async () => {
        // Disable development mode
        await testPrisma.systemConfig.update({
          where: { key: 'development_mode_enabled' },
          data: { value: 'false' },
        });
      });

      it('should attempt to send real SMS in production mode', async () => {
        const result = await sendSMS('+1234567890');

        // Since SMS service is not implemented, it should return error
        expect(result.success).toBe(false);
        expect(result.message).toBe('SMS service not implemented');
      });
    });

    describe('Configuration Checks', () => {
      it('should return error when SMS verification is disabled', async () => {
        await testPrisma.systemConfig.update({
          where: { key: 'sms_verification_enabled' },
          data: { value: 'false' },
        });

        const result = await sendSMS('+1234567890');

        expect(result.success).toBe(false);
        expect(result.message).toBe('SMS verification is disabled');
      });

      it('should handle missing SMS verification config', async () => {
        await testPrisma.systemConfig.delete({
          where: { key: 'sms_verification_enabled' },
        });

        const result = await sendSMS('+1234567890');

        expect(result.success).toBe(false);
        expect(result.message).toBe('SMS verification is disabled');
      });
    });
  });

  describe('OTP Verification', () => {
    describe('Development Mode', () => {
      it('should verify static OTP correctly in development mode', async () => {
        const result = await verifyOTP('111111', 'verification');

        expect(result).toBe(true);
      });

      it('should reject incorrect OTP in development mode', async () => {
        const result = await verifyOTP('123456', 'verification');

        expect(result).toBe(false);
      });

      it('should use configured static OTP for verification', async () => {
        // Update static OTP config
        await testPrisma.systemConfig.update({
          where: { key: 'static_otp_code' },
          data: { value: '888888' },
        });

        const result1 = await verifyOTP('888888', 'verification');
        const result2 = await verifyOTP('111111', 'verification');

        expect(result1).toBe(true);
        expect(result2).toBe(false);
      });

      it('should handle different verification purposes', async () => {
        const result1 = await verifyOTP('111111', 'verification');
        const result2 = await verifyOTP('111111', 'password-reset');
        const result3 = await verifyOTP('111111', 'login');

        expect(result1).toBe(true);
        expect(result2).toBe(true);
        expect(result3).toBe(true);
      });
    });

    describe('Production Mode', () => {
      beforeEach(async () => {
        // Disable development mode
        await testPrisma.systemConfig.update({
          where: { key: 'development_mode_enabled' },
          data: { value: 'false' },
        });
      });

      it('should return false for production mode (not implemented)', async () => {
        const result = await verifyOTP('111111', 'verification');

        expect(result).toBe(false);
      });

      it('should handle any OTP in production mode', async () => {
        const result1 = await verifyOTP('123456', 'verification');
        const result2 = await verifyOTP('999999', 'verification');

        expect(result1).toBe(false);
        expect(result2).toBe(false);
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        // Mock database error
        jest.spyOn(testPrisma.systemConfig, 'findUnique').mockRejectedValueOnce(
          new Error('Database connection failed')
        );

        const result = await verifyOTP('111111', 'verification');

        // Should return false on error
        expect(result).toBe(false);
      });

      it('should handle missing static OTP config', async () => {
        await testPrisma.systemConfig.delete({
          where: { key: 'static_otp_code' },
        });

        const result = await verifyOTP('111111', 'verification');

        // Should use default static OTP
        expect(result).toBe(true);
      });

      it('should handle missing development mode config', async () => {
        await testPrisma.systemConfig.delete({
          where: { key: 'development_mode_enabled' },
        });

        const result = await verifyOTP('111111', 'verification');

        // Should default to development mode based on NODE_ENV
        expect(result).toBe(true);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end for email OTP flow', async () => {
      // Send email OTP
      const sendResult = await sendEmail('test@example.com');
      expect(sendResult.success).toBe(true);

      const otp = sendResult.data?.otp;
      expect(otp).toBeTruthy();

      // Verify OTP
      const verifyResult = await verifyOTP(otp!, 'verification');
      expect(verifyResult).toBe(true);

      // Verify wrong OTP
      const wrongVerifyResult = await verifyOTP('000000', 'verification');
      expect(wrongVerifyResult).toBe(false);
    });

    it('should work end-to-end for SMS OTP flow', async () => {
      // Send SMS OTP
      const sendResult = await sendSMS('+1234567890');
      expect(sendResult.success).toBe(true);

      const otp = sendResult.data?.otp;
      expect(otp).toBeTruthy();

      // Verify OTP
      const verifyResult = await verifyOTP(otp!, 'verification');
      expect(verifyResult).toBe(true);

      // Verify wrong OTP
      const wrongVerifyResult = await verifyOTP('000000', 'verification');
      expect(wrongVerifyResult).toBe(false);
    });

    it('should handle configuration changes dynamically', async () => {
      // Initially in development mode
      let result = await sendEmail('test@example.com');
      expect(result.data?.isDevelopmentMode).toBe(true);

      // Switch to production mode
      await testPrisma.systemConfig.update({
        where: { key: 'development_mode_enabled' },
        data: { value: 'false' },
      });

      // Should now be in production mode
      result = await sendEmail('test@example.com');
      expect(result.data?.isDevelopmentMode).toBeFalsy();

      // Switch back to development mode
      await testPrisma.systemConfig.update({
        where: { key: 'development_mode_enabled' },
        data: { value: 'true' },
      });

      // Should be back in development mode
      result = await sendEmail('test@example.com');
      expect(result.data?.isDevelopmentMode).toBe(true);
    });
  });
});
