import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import {
  sendSMS,
  sendEmail,
  sendWhatsApp,
  generateOTP as generateOTPCode
} from '../services/otpService';
import {  logger, logOTPOperation } from '../config/logger';
import { normalizePhoneForDB, formatPhoneForOTP } from '../utils/helpers';

const router = express.Router();
const prisma = new PrismaClient();

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expiresAt: Date; verified: boolean }>();



// Validation schemas
const sendOtpSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  type: z.enum(['phone', 'email', 'whatsapp']),
});

const verifyOtpSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  type: z.enum(['phone', 'email']),
  isResettingPassword: z.boolean().optional(),
});

const setPasswordSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  name: z.string().min(1, 'Name is required'),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
});

const completeSignupSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  type: z.enum(['phone', 'email']),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  name: z.string().min(1, 'Name is required'),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
});

const checkUserSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  type: z.enum(['phone', 'email']),
});

const loginSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  type: z.enum(['phone', 'email', 'whatsapp']),
  password: z.string().min(1, 'Password is required').optional(),
});

const resetPasswordSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  type: z.enum(['email']),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// POST /api/v1/auth/send-otp - Send OTP to phone or email
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    logger.info('Send OTP request received', { body: req.body });
    const validatedData = sendOtpSchema.parse(req.body);
    let { contact, type } = validatedData;

    // Normalize phone number for storage (remove country code)
    const normalizedContact = type === 'email' ? contact : normalizePhoneForDB(contact);
    // Format phone number for SMS sending (add country code)
    const formattedContactForSMS = type === 'email' ? contact : formatPhoneForOTP(contact);

    logger.info('Send OTP validated data', {
      contact: normalizedContact.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
      type
    });

    // Check if verification is enabled for this type
    let configKey: string;
    if (type === 'email') {
      configKey = 'email_verification_enabled';
    } else if (type === 'whatsapp') {
      configKey = 'whatsapp_verification_enabled';
    } else {
      configKey = 'sms_verification_enabled';
    }

    const verificationConfig = await prisma.systemConfig.findUnique({
      where: { key: configKey }
    });

    const isVerificationEnabled = verificationConfig?.value === 'true';

    if (!isVerificationEnabled) {
      // If verification is disabled, create a dummy OTP entry and return success
      const dummyOtp = '000000';
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      otpStore.set(normalizedContact, { otp: dummyOtp, expiresAt, verified: true }); // Mark as pre-verified

      return res.json({
        success: true,
        message: `Verification disabled. You can proceed without OTP.`,
        data: {
          contact: normalizedContact,
          type,
          verificationDisabled: true,
          expiresIn: 300,
        },
      });
    }

    // Generate OTP first
    let otp: string;

    // Check if we're in development mode to use static OTP
    const isDev = await prisma.systemConfig.findUnique({
      where: { key: 'development_mode_enabled' }
    });

    if (isDev?.value === 'true') {
      // Development mode - use static OTP
      const staticOtpConfig = await prisma.systemConfig.findUnique({
        where: { key: 'static_otp_code' }
      });
      otp = staticOtpConfig?.value || '111111';
    } else {
      // Production mode - generate random OTP
      otp = generateOTPCode();
    }

    // Send OTP using the service with the generated OTP (use formatted phone for SMS)
    let result;
    if (type === 'phone') {
      result = await sendSMS(formattedContactForSMS, otp);
    } else if (type === 'whatsapp') {
      result = await sendWhatsApp(formattedContactForSMS, otp);
    } else {
      result = await sendEmail(contact, otp);
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to send OTP. Please try again.',
      });
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP with normalized contact (without country code)
    otpStore.set(normalizedContact, { otp, expiresAt, verified: false });

    logger.info('OTP stored successfully', {
      contact: normalizedContact.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
      otp: otp.replace(/\d/g, '*'),
      expiresAt,
      storeSize: otpStore.size
    });

    const messageMap = {
      phone: 'OTP sent to your phone',
      email: 'OTP sent to your email',
      whatsapp: 'OTP sent to your WhatsApp'
    };

    // Check if we're in development mode to include additional info
    const devModeConfig = await prisma.systemConfig.findUnique({
      where: { key: 'development_mode_enabled' }
    });
    const isDevMode = devModeConfig?.value === 'true';

    const responseData: any = {
      contact,
      type,
      expiresIn: 300, // 5 minutes in seconds
    };

    // Include development mode info if enabled
    if (isDevMode) {
      responseData.isDevelopmentMode = true;
      responseData.otp = otp; // Include the actual OTP for development
    }

    res.json({
      success: true,
      message: messageMap[type as keyof typeof messageMap] || `OTP sent to your ${type}`,
      data: responseData,
    });
  } catch (error) {
    logger.error('Error sending OTP', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
    });
  }
});

// POST /api/v1/auth/verify-otp - Verify OTP
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    logger.info('Verify OTP request received', { body: req.body });
    const validatedData = verifyOtpSchema.parse(req.body);
    let { contact, otp, type, isResettingPassword } = validatedData;

    // Normalize phone number (remove country code for storage/lookup)
    const normalizedContact = type === 'email' ? contact : normalizePhoneForDB(contact);

    logger.info('Verify OTP validated data', {
      contact: normalizedContact.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
      otp: otp.replace(/\d/g, '*'),
      type
    });

    // Log current OTP store state
    logger.info('Current OTP store state', {
      storeSize: otpStore.size,
      storeKeys: Array.from(otpStore.keys()).map(key => key.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'))
    });

    // Check if OTP exists (use normalized contact)
    const storedOtp = otpStore.get(normalizedContact);
    logger.info('OTP lookup result', {
      contact: normalizedContact.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
      found: !!storedOtp,
      storedOtpExists: storedOtp ? true : false
    });

    if (!storedOtp) {
      logger.warn('OTP not found in store', {
        contact: normalizedContact.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
        requestedOtp: otp.replace(/\d/g, '*')
      });
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new one.',
      });
    }

    // Check if verification was disabled (pre-verified)
    if (storedOtp.verified && storedOtp.otp === '000000') {
      // Verification was disabled, proceed directly
      // Continue with the rest of the logic...
    } else {
      // Check if OTP is expired
      if (new Date() > storedOtp.expiresAt) {
        otpStore.delete(normalizedContact);
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new one.',
        });
      }

      // Check if OTP matches the stored one
      logger.info('Comparing OTPs', {
        storedOtp: storedOtp.otp.replace(/\d/g, '*'),
        providedOtp: otp.replace(/\d/g, '*'),
        match: storedOtp.otp === otp
      });

      if (storedOtp.otp !== otp) {
        logger.warn('OTP mismatch', {
          contact: normalizedContact.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
          storedOtp: storedOtp.otp.replace(/\d/g, '*'),
          providedOtp: otp.replace(/\d/g, '*')
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP. Please try again.',
        });
      }

      // Mark OTP as verified
      storedOtp.verified = true;
      otpStore.set(normalizedContact, storedOtp);

      logger.info('OTP verified successfully', {
        contact: normalizedContact.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')
      });
    }

    // Check if user exists (use normalized contact for DB lookup)
    const existingUser = await prisma.user.findFirst({
      where: type === 'email'
        ? { email: normalizedContact }
        : { phone: normalizedContact }
    });

    if (existingUser) {
      // If resetting password, don't log in yet - just confirm OTP is verified
      if (isResettingPassword) {
        res.json({
          success: true,
          message: 'OTP verified. Please set your new password.',
          data: {
            contact: normalizedContact,
            type,
            needsPasswordReset: true,
          },
        });
        return;
      }

      // User exists, log them in
      const token = jwt.sign(
        {
          userId: existingUser.id,
          email: existingUser.email,
          role: existingUser.role
        },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Clean up OTP (use normalized contact)
      otpStore.delete(normalizedContact);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            phone: existingUser.phone,
            role: existingUser.role,
          },
        },
      });
    } else {
      // New user - both phone and email users need to complete signup
      res.json({
        success: true,
        message: 'OTP verified. Please complete your profile.',
        data: {
          contact: normalizedContact,
          type,
          needsSignup: true,
        },
      });
    }
  } catch (error) {
    logger.error('Error verifying OTP', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
    });
  }
});

// POST /api/v1/auth/complete-signup - Complete signup for new users (both phone and email)
router.post('/complete-signup', async (req: Request, res: Response) => {
  try {
    logger.info('Complete signup request received', { body: req.body });

    try {
      const validatedData = completeSignupSchema.parse(req.body);
      const { contact, type, password, name, gender } = validatedData;
      logger.info('Complete signup validated data', {
        contact: contact.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
        type,
        name,
        gender,
        hasPassword: !!password
      });
    } catch (validationError) {
      logger.error('Complete signup validation failed', {
        error: validationError,
        body: req.body
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: validationError
      });
    }

    const validatedData = completeSignupSchema.parse(req.body);
    let { contact, type, password, name, gender } = validatedData;

    // Normalize phone number (remove country code)
    const normalizedContact = type === 'email' ? contact : normalizePhoneForDB(contact);

    // Check if OTP was verified (use normalized contact)
    const storedOtp = otpStore.get(normalizedContact);
    logger.info('Complete signup OTP check', {
      contact: normalizedContact.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
      otpExists: !!storedOtp,
      otpVerified: storedOtp?.verified || false,
      storeSize: otpStore.size
    });

    if (!storedOtp || !storedOtp.verified) {
      logger.warn('Complete signup failed - OTP not verified', {
        contact: normalizedContact.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
        reason: !storedOtp ? 'OTP not found' : 'OTP not verified'
      });
      return res.status(400).json({
        success: false,
        message: `Please verify your ${type} first.`,
      });
    }

    // Prepare user data
    const userData: any = {
      name,
      role: 'CUSTOMER',
      gender: gender || null,
    };

    // Handle password (optional for phone users)
    if (password) {
      userData.password = await bcrypt.hash(password, 10);
    } else {
      // Generate a random password for users who don't set one
      userData.password = await bcrypt.hash(Math.random().toString(36), 10);
    }

    // Set email and phone based on type (use normalized contact)
    if (type === 'email') {
      userData.email = normalizedContact;
      userData.emailVerified = true;
    } else {
      userData.phone = normalizedContact;
      // Generate unique email from phone for phone users
      userData.email = `${normalizedContact.replace(/\D/g, '')}@phone.cutq.com`;
    }

    // Create user
    const newUser = await prisma.user.create({
      data: userData,
    });

    // Create loyalty account for new user
    await prisma.loyaltyAccount.create({
      data: {
        userId: newUser.id,
        points: 0,
        totalSpent: 0,
        level: 'Bronze',
      },
    });

    // Generate token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Clean up OTP (use normalized contact)
    otpStore.delete(normalizedContact);

    res.json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          gender: newUser.gender,
          role: newUser.role,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error completing signup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account',
    });
  }
});

// POST /api/v1/auth/set-password - Set password for email users (legacy endpoint)
router.post('/set-password', async (req: Request, res: Response) => {
  try {
    const validatedData = setPasswordSchema.parse(req.body);
    const { contact, password, name, gender } = validatedData;

    // Check if OTP was verified
    const storedOtp = otpStore.get(contact);
    if (!storedOtp || !storedOtp.verified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email first.',
      });
    }

    // Hash password (required for this endpoint)
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email: contact,
        password: hashedPassword,
        gender: gender || null,
        role: 'CUSTOMER',
        emailVerified: true,
      },
    });

    // Create loyalty account for new user
    await prisma.loyaltyAccount.create({
      data: {
        userId: newUser.id,
        points: 0,
        totalSpent: 0,
        level: 'Bronze',
      },
    });

    // Generate token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Clean up OTP
    otpStore.delete(contact);

    res.json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          gender: newUser.gender,
          role: newUser.role,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error setting password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account',
    });
  }
});

// POST /api/v1/auth/check-user - Check if user exists for login flow
router.post('/check-user', async (req: Request, res: Response) => {
  try {
    const validatedData = checkUserSchema.parse(req.body);
    let { contact, type } = validatedData;

    // Normalize phone number (remove country code)
    const normalizedContact = type === 'email' ? contact : normalizePhoneForDB(contact);

    // Check if user exists (use normalized contact)
    const existingUser = await prisma.user.findFirst({
      where: type === 'email'
        ? { email: normalizedContact }
        : { phone: normalizedContact }
    });

    if (existingUser) {
      // Check if user has a password set
      // For email users: check if they have a real email (not auto-generated from phone)
      // For phone users: they typically use OTP login
      let hasPassword = false;

      if (type === 'email') {
        // Email users should have password unless they signed up via social auth
        // Check if email is not auto-generated from phone number
        const isPhoneGeneratedEmail = existingUser.email.endsWith('@phone.cutq.com');
        hasPassword = !isPhoneGeneratedEmail && !!existingUser.password;
      } else {
        // Phone users typically use OTP, but might have set password later
        // For now, always use OTP for phone login
        hasPassword = false;
      }

      res.json({
        success: true,
        message: hasPassword
          ? 'User found. Please enter your password.'
          : 'User found. We will send you an OTP to login.',
        data: {
          exists: true,
          hasPassword,
        }
      });
    } else {
      res.json({
        success: true,
        message: 'New user. Please sign up.',
        data: {
          exists: false,
          hasPassword: false,
        }
      });
    }
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check user',
    });
  }
});


// POST /api/v1/auth/otp-login - Login with password or OTP (renamed to avoid conflict)
router.post('/otp-login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { contact, type, password } = validatedData;

    // Find user
    const user = await prisma.user.findFirst({
      where: type === 'email'
        ? { email: contact }
        : { phone: contact }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found. Please sign up first.',
      });
    }

    // Check if user has a password set
    // Email users with real emails (not auto-generated) should have passwords
    const isPhoneGeneratedEmail = user.email.endsWith('@phone.cutq.com');
    const hasPassword = !isPhoneGeneratedEmail && !!user.password;

    if (hasPassword && password) {
      // Password login
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Invalid password. Please try again.',
        });
      }

      // Generate token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role
        },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
        },
      });
    } else if (!hasPassword) {
      // User doesn't have password, need OTP login
      return res.status(400).json({
        success: false,
        message: 'Please use OTP login for this account.',
        needsOTP: true,
      });
    } else {
      // Password required but not provided
      return res.status(400).json({
        success: false,
        message: 'Password is required for this account.',
      });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
});

// POST /api/v1/auth/reset-password - Reset password after OTP verification
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    let { contact, type, newPassword } = validatedData;

    // Normalize contact (email stays same, phone gets normalized)
    const normalizedContact = type === 'email' ? contact : normalizePhoneForDB(contact);

    // Check if OTP was verified (use normalized contact)
    const storedOtp = otpStore.get(normalizedContact);
    if (!storedOtp || !storedOtp.verified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email with OTP first.',
      });
    }

    // Find user (use normalized contact)
    const user = await prisma.user.findFirst({
      where: { email: normalizedContact }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Generate token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Clean up OTP (use normalized contact)
    otpStore.delete(normalizedContact);

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
});

export default router;
