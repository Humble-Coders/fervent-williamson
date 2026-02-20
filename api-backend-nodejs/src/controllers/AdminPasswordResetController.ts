import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { catchAsync } from '../middleware/errorHandler';
import { createResponse } from '../utils/helpers';
import { logger } from '../config/logger';

// Validation schema for password reset
const adminPasswordResetSchema = z.object({
    email: z.string().email('Invalid email format'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    setupPassword: z.string().min(1, 'Setup password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export class AdminPasswordResetController {

    /**
   * Verify setup password and return list of admins
   */
    verifySetupPassword = catchAsync(async (req: Request, res: Response) => {
        const { setupPassword } = req.body;

        if (!setupPassword) {
            return res.status(400).json(createResponse(false, null, 'Setup password is required'));
        }

        // Verify setup password
        const expectedSetupPassword = process.env.ADMIN_SETUP_PASSWORD;

        logger.info('Verifying setup password', {
            received: setupPassword,
            // expectedSource: expectedSetupPassword ? 'SETUP_PASSWORD' : 'DEFAULT',
            // Do not log the actual password in production, but for debugging now:
            expectedValue: expectedSetupPassword
        });

        if (setupPassword !== expectedSetupPassword) {
            logger.warn('Invalid setup password attempt', { ip: req.ip });
            return res.status(403).json(createResponse(false, null, 'Invalid setup password'));
        }

        // Get all admin users
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true
            }
        });

        return res.json(createResponse(true, { admins }, 'Setup password verified'));
    });

    /**
     * Reset admin password using setup password
     */
    resetPassword = catchAsync(async (req: Request, res: Response) => {
        // Validate request body
        const validationResult = adminPasswordResetSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json(createResponse(
                false,
                null,
                'Validation failed',
                validationResult.error.issues
            ));
        }

        const { email, newPassword, setupPassword } = validationResult.data;

        // Verify setup password again for security
        const expectedSetupPassword = process.env.ADMIN_SETUP_PASSWORD;

        if (setupPassword !== expectedSetupPassword) {
            return res.status(403).json(createResponse(false, null, 'Invalid setup password'));
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json(createResponse(false, null, 'User not found'));
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword
            }
        });

        logger.info('Admin password reset successfully', {
            userId: user.id,
            email
        });

        return res.json(createResponse(
            true,
            null,
            'Password reset successfully'
        ));
    });
}
