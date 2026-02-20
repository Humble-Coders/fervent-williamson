import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken } from '../middleware/simpleAuth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createOfferSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SERVICE', 'BOGO']),
  value: z.number().min(0, 'Value must be non-negative'),
  code: z.string().min(3, 'Code must be at least 3 characters').optional(),
  minPurchase: z.number().min(0, 'Minimum purchase must be non-negative').optional(),
  maxDiscount: z.number().min(0, 'Maximum discount must be non-negative').optional(),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid from must be in YYYY-MM-DD format'),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid until must be in YYYY-MM-DD format'),
  usageLimit: z.number().min(1, 'Usage limit must be at least 1').optional(),
  salonId: z.string().min(1, 'Salon ID is required').optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

const updateOfferSchema = createOfferSchema.partial();

// GET /api/v1/offers - Get all offers with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { salonId, isActive, isFeatured, type } = req.query;

    const where: any = {};
    if (salonId) where.salonId = salonId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';
    if (type) where.type = type;

    // Only show active offers that haven't expired for public access
    if (!req.headers.authorization) {
      where.isActive = true;
      where.validUntil = {
        gte: new Date()
      };
    }

    const offers = await prisma.offer.findMany({
      where,
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            images: true,
          }
        },
        usedBy: {
          select: {
            id: true,
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: offers,
      message: 'Offers retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offers',
    });
  }
});

// GET /api/v1/offers/:id - Get offer by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            images: true,
          }
        },
        usedBy: {
          select: {
            id: true,
          }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    res.json({
      success: true,
      data: offer,
      message: 'Offer retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offer',
    });
  }
});

// POST /api/v1/offers - Create a new offer
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const validatedData = createOfferSchema.parse(req.body);

    // Verify salon exists if salonId is provided
    if (validatedData.salonId) {
      const salon = await prisma.salon.findUnique({
        where: { id: validatedData.salonId }
      });

      if (!salon) {
        return res.status(400).json({
          success: false,
          message: 'Salon not found',
        });
      }
    }

    // Validate date range
    const validFrom = new Date(validatedData.validFrom);
    const validUntil = new Date(validatedData.validUntil);
    
    if (validUntil <= validFrom) {
      return res.status(400).json({
        success: false,
        message: 'Valid until date must be after valid from date',
      });
    }

    // Check if code is unique (if provided)
    if (validatedData.code) {
      const existingOffer = await prisma.offer.findFirst({
        where: {
          code: validatedData.code,
          isActive: true
        }
      });

      if (existingOffer) {
        return res.status(400).json({
          success: false,
          message: 'Offer code already exists',
        });
      }
    }

    const offer = await prisma.offer.create({
      data: {
        ...validatedData,
        validFrom: new Date(validatedData.validFrom),
        validUntil: new Date(validatedData.validUntil),
      },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            images: true,
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: offer,
      message: 'Offer created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error creating offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create offer',
    });
  }
});

// PUT /api/v1/offers/:id - Update offer
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateOfferSchema.parse(req.body);

    // Check if offer exists
    const existingOffer = await prisma.offer.findUnique({
      where: { id }
    });

    if (!existingOffer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    // Verify salon exists if salonId is being updated
    if (validatedData.salonId) {
      const salon = await prisma.salon.findUnique({
        where: { id: validatedData.salonId }
      });

      if (!salon) {
        return res.status(400).json({
          success: false,
          message: 'Salon not found',
        });
      }
    }

    // Validate date range if dates are being updated
    if (validatedData.validFrom || validatedData.validUntil) {
      const validFrom = new Date(validatedData.validFrom || existingOffer.validFrom);
      const validUntil = new Date(validatedData.validUntil || existingOffer.validUntil);
      
      if (validUntil <= validFrom) {
        return res.status(400).json({
          success: false,
          message: 'Valid until date must be after valid from date',
        });
      }
    }

    // Check if code is unique (if being updated)
    if (validatedData.code && validatedData.code !== existingOffer.code) {
      const duplicateOffer = await prisma.offer.findFirst({
        where: {
          code: validatedData.code,
          isActive: true,
          id: { not: id }
        }
      });

      if (duplicateOffer) {
        return res.status(400).json({
          success: false,
          message: 'Offer code already exists',
        });
      }
    }

    const updateData: any = { ...validatedData };
    if (validatedData.validFrom) {
      updateData.validFrom = new Date(validatedData.validFrom);
    }
    if (validatedData.validUntil) {
      updateData.validUntil = new Date(validatedData.validUntil);
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: updateData,
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            images: true,
          }
        }
      }
    });

    res.json({
      success: true,
      data: offer,
      message: 'Offer updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error updating offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update offer',
    });
  }
});

// DELETE /api/v1/offers/:id - Delete offer
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if offer exists
    const existingOffer = await prisma.offer.findUnique({
      where: { id },
      include: {
        usedBy: {
          select: {
            id: true,
          }
        }
      }
    });

    if (!existingOffer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    // Check if offer has been used
    if (existingOffer.usedBy.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete offer that has been used. Deactivate it instead.',
      });
    }

    await prisma.offer.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Offer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete offer',
    });
  }
});

export default router;
