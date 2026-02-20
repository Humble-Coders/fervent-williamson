import express, { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@/config/database';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Validation schema for updating subservice
const updateSubServiceSchema = z.object({
  name: z.string().min(1, 'SubService name is required').optional(),
  description: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute').optional(),
  price: z.number().min(0, 'Price must be non-negative').optional(),
  priceCanVary: z.boolean().optional(),
  timeCanVary: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// PUT /api/v1/subservices/:id - Update subservice
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateSubServiceSchema.parse(req.body);

    // Check if subservice exists
    const existingSubService = await prisma.subService.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            salon: true
          }
        }
      }
    });

    if (!existingSubService) {
      return res.status(404).json({
        success: false,
        message: 'SubService not found',
      });
    }

    // Verify user has permission to update this subservice
    const user = (req as any).user;
    if (user.role !== 'ADMIN' && existingSubService.service.salon.ownerId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this subservice',
      });
    }

    // Update the subservice
    const updatedSubService = await prisma.subService.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      success: true,
      data: updatedSubService,
      message: 'SubService updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error updating subservice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subservice',
    });
  }
});

// GET /api/v1/subservices/:id - Get subservice by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subService = await prisma.subService.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            salonId: true,
          }
        }
      }
    });

    if (!subService) {
      return res.status(404).json({
        success: false,
        message: 'SubService not found',
      });
    }

    res.json({
      success: true,
      data: subService,
      message: 'SubService retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching subservice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subservice',
    });
  }
});

export default router;

