import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { catchAsync } from '../middleware/errorHandler';
import { createResponse } from '../utils/helpers';
import { logger } from '../config/logger';
import { AuthService } from '../services/AuthService';

// Validation schema for admin signup
const adminSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  setupPassword: z.string().min(1, 'Setup password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export class AdminSignupController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Check if admin signup is available (no admin users exist)
   */
  checkSignupAvailable = catchAsync(async (req: Request, res: Response) => {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });

    const isAvailable = adminCount === 0;

    logger.info('Admin signup availability check', { 
      adminCount, 
      isAvailable 
    });

    return res.json(createResponse(true, {
      available: isAvailable,
      message: isAvailable 
        ? 'Admin signup is available' 
        : 'Admin user already exists'
    }, 'Signup availability checked'));
  });

  /**
   * Create the first admin user
   */
  createAdmin = catchAsync(async (req: Request, res: Response) => {
    // Validate request body
    const validationResult = adminSignupSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json(createResponse(
        false,
        null,
        'Validation failed',
        validationResult.error.issues
      ));
    }

    const { name, email, password, setupPassword } = validationResult.data;

    // Check setup password (this should be a secure password set in environment)
    const expectedSetupPassword = process.env.ADMIN_SETUP_PASSWORD || 'admin-setup-2024';
    
    if (setupPassword !== expectedSetupPassword) {
      logger.warn('Invalid setup password attempt', { 
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        email 
      });
      
      return res.status(403).json(createResponse(
        false, 
        null, 
        'Invalid setup password'
      ));
    }

    // Check if any admin already exists
    const existingAdminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });

    if (existingAdminCount > 0) {
      logger.warn('Admin signup attempted when admin already exists', { 
        ip: req.ip,
        email 
      });
      
      return res.status(409).json(createResponse(
        false, 
        null, 
        'Admin user already exists'
      ));
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json(createResponse(
        false, 
        null, 
        'Email already registered'
      ));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    logger.info('First admin user created successfully', { 
      adminId: adminUser.id,
      email: adminUser.email 
    });

    // Generate tokens for immediate login
    const result = await this.authService.login(email, password);

    return res.status(201).json(createResponse(
      true, 
      {
        user: adminUser,
        ...result
      }, 
      'Admin user created successfully'
    ));
  });
}
