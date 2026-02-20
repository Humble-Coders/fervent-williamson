import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken } from '../middleware/simpleAuth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const addFavoriteSchema = z.object({
  salonId: z.string().min(1, 'Salon ID is required'),
});

// GET /api/v1/favorites - Get user's favorite salons
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        salon: {
          select: {
            id: true,
            displayId: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            images: true,
            rating: true,
            isOpen: true,
            createdAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: favorites,
      message: 'Favorites retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites',
    });
  }
});

// POST /api/v1/favorites - Add salon to favorites
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const validatedData = addFavoriteSchema.parse(req.body);
    const userId = (req as any).user.id;
    const { salonId } = validatedData;

    // Check if salon exists (support both UUID and displayId)
    const isDisplayId = /^\d+$/.test(salonId);
    const salon = await prisma.salon.findUnique({
      where: isDisplayId ? { displayId: parseInt(salonId) } : { id: salonId }
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found',
      });
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_salonId: {
          userId,
          salonId: salon.id
        }
      }
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Salon is already in favorites',
      });
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        salonId: salon.id
      },
      include: {
        salon: {
          select: {
            id: true,
            displayId: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            images: true,
            rating: true,
            isOpen: true,
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: favorite,
      message: 'Salon added to favorites successfully',
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to add salon to favorites',
    });
  }
});

// DELETE /api/v1/favorites/:salonId - Remove salon from favorites
router.delete('/:salonId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = (req as any).user.id;

    // Check if salon exists (support both UUID and displayId)
    const isDisplayId = /^\d+$/.test(salonId);
    const salon = await prisma.salon.findUnique({
      where: isDisplayId ? { displayId: parseInt(salonId) } : { id: salonId }
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found',
      });
    }

    // Check if favorite exists
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_salonId: {
          userId,
          salonId: salon.id
        }
      }
    });

    if (!existingFavorite) {
      return res.status(404).json({
        success: false,
        message: 'Salon is not in favorites',
      });
    }

    // Remove from favorites
    await prisma.favorite.delete({
      where: {
        userId_salonId: {
          userId,
          salonId: salon.id
        }
      }
    });

    res.json({
      success: true,
      message: 'Salon removed from favorites successfully',
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove salon from favorites',
    });
  }
});

// GET /api/v1/favorites/check/:salonId - Check if salon is favorited
router.get('/check/:salonId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = (req as any).user.id;

    // Check if salon exists (support both UUID and displayId)
    const isDisplayId = /^\d+$/.test(salonId);
    const salon = await prisma.salon.findUnique({
      where: isDisplayId ? { displayId: parseInt(salonId) } : { id: salonId }
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found',
      });
    }

    // Check if favorite exists
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_salonId: {
          userId,
          salonId: salon.id
        }
      }
    });

    res.json({
      success: true,
      data: {
        isFavorited: !!existingFavorite
      },
      message: 'Favorite status retrieved successfully',
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status',
    });
  }
});

export default router;
