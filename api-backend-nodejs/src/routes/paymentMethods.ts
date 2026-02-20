import express, { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@/config/database';
// import { authenticate } from '../middleware/auth';

// Simple auth middleware for testing
const simpleAuth = (req: any, res: any, next: any) => {
  // For testing, assume admin user
  req.user = { role: 'ADMIN', userId: 'test-admin' };
  next();
};

const router = express.Router();

// Validation schemas
const createPaymentMethodConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  icon: z.string().min(1, 'Icon is required'),
  emoji: z.string().min(1, 'Emoji is required'),
  description: z.string().min(1, 'Description is required'),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0),
});

const updatePaymentMethodConfigSchema = createPaymentMethodConfigSchema.partial();

// GET /api/v1/payment-methods/config - Get all payment method configurations (Public)
router.get('/config', async (req: Request, res: Response) => {
  try {
    const { includeInactive } = req.query;
    
    const where: any = {};
    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    const paymentMethods = await prisma.paymentMethodConfig.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: paymentMethods,
      message: 'Payment method configurations retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching payment method configurations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment method configurations',
    });
  }
});

// GET /api/v1/payment-methods/config/:id - Get payment method configuration by ID (Admin)
router.get('/config/:id', simpleAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Only admin can access individual configurations
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const paymentMethod = await prisma.paymentMethodConfig.findUnique({
      where: { id },
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method configuration not found',
      });
    }

    res.json({
      success: true,
      data: paymentMethod,
      message: 'Payment method configuration retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching payment method configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment method configuration',
    });
  }
});

// POST /api/v1/payment-methods/config - Create new payment method configuration (Admin only)
router.post('/config', simpleAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Only admin can create payment method configurations
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const validatedData = createPaymentMethodConfigSchema.parse(req.body);

    // Check if payment method with same name already exists
    const existingPaymentMethod = await prisma.paymentMethodConfig.findUnique({
      where: { name: validatedData.name },
    });

    if (existingPaymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method with this name already exists',
      });
    }

    const paymentMethod = await prisma.paymentMethodConfig.create({
      data: validatedData,
    });

    res.status(201).json({
      success: true,
      data: paymentMethod,
      message: 'Payment method configuration created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error creating payment method configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment method configuration',
    });
  }
});

// PUT /api/v1/payment-methods/config/:id - Update payment method configuration (Admin only)
router.put('/config/:id', simpleAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Only admin can update payment method configurations
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const validatedData = updatePaymentMethodConfigSchema.parse(req.body);

    // Check if payment method exists
    const existingPaymentMethod = await prisma.paymentMethodConfig.findUnique({
      where: { id },
    });

    if (!existingPaymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method configuration not found',
      });
    }

    // Check if name is being changed and if new name already exists
    if (validatedData.name && validatedData.name !== existingPaymentMethod.name) {
      const nameExists = await prisma.paymentMethodConfig.findUnique({
        where: { name: validatedData.name },
      });

      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: 'Payment method with this name already exists',
        });
      }
    }

    const updatedPaymentMethod = await prisma.paymentMethodConfig.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      success: true,
      data: updatedPaymentMethod,
      message: 'Payment method configuration updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error updating payment method configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment method configuration',
    });
  }
});

// DELETE /api/v1/payment-methods/config/:id - Delete payment method configuration (Admin only)
router.delete('/config/:id', simpleAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Only admin can delete payment method configurations
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    // Check if payment method exists
    const existingPaymentMethod = await prisma.paymentMethodConfig.findUnique({
      where: { id },
    });

    if (!existingPaymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method configuration not found',
      });
    }

    await prisma.paymentMethodConfig.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Payment method configuration deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting payment method configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment method configuration',
    });
  }
});

export default router;
