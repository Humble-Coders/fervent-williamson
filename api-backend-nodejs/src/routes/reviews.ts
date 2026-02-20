import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken } from '../middleware/simpleAuth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/reviews/salon/:salonId - Get reviews for a salon
router.get('/salon/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await prisma.review.findMany({
      where: { salonId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        },
        booking: {
          select: {
            id: true,
            service: {
              select: {
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const totalReviews = await prisma.review.count({
      where: { salonId }
    });

    const averageRating = await prisma.review.aggregate({
      where: { salonId },
      _avg: {
        rating: true
      }
    });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalReviews,
          pages: Math.ceil(totalReviews / Number(limit))
        },
        averageRating: averageRating._avg.rating || 0,
        totalReviews
      },
      message: 'Reviews retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
    });
  }
});

// POST /api/v1/reviews - Create a new review
const createReviewSchema = z.object({
  salonId: z.string().min(1, 'Salon ID is required'),
  bookingId: z.string().min(1, 'Booking ID is required'),
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(1, 'Comment is required'),
});

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const validatedData = createReviewSchema.parse(req.body);
    const userId = (req as any).user.userId;

    // Check if booking exists and belongs to the user
    const booking = await prisma.booking.findFirst({
      where: {
        id: validatedData.bookingId,
        userId: userId,
        status: 'COMPLETED' // Only allow reviews for completed bookings
      },
      include: {
        salon: true,
        service: true
      }
    });

    if (!booking) {
      return res.status(400).json({
        success: false,
        message: 'Booking not found or not completed. You can only review completed bookings.',
      });
    }

    // Check if user already reviewed this booking
    const existingReview = await prisma.review.findFirst({
      where: {
        bookingId: validatedData.bookingId,
        userId: userId
      }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this booking.',
      });
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        salonId: validatedData.salonId,
        bookingId: validatedData.bookingId,
        rating: validatedData.rating,
        comment: validatedData.comment,
        userId: userId,
        service: booking.service?.name || 'Service',
        emoji: '⭐',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        },
        booking: {
          select: {
            id: true,
            service: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    });

    // Update salon's average rating
    const salonReviews = await prisma.review.findMany({
      where: { salonId: validatedData.salonId },
      select: { rating: true }
    });

    const averageRating = salonReviews.reduce((sum, r) => sum + r.rating, 0) / salonReviews.length;
    
    await prisma.salon.update({
      where: { id: validatedData.salonId },
      data: { 
        rating: averageRating,
        reviewCount: salonReviews.length
      }
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
    });
  }
});

// PUT /api/v1/reviews/:id - Update a review
const updateReviewSchema = createReviewSchema.partial().omit({ salonId: true, bookingId: true });

router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateReviewSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const review = await prisma.review.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to update it',
      });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        },
        booking: {
          select: {
            id: true,
            service: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    });

    // Update salon's average rating if rating was changed
    if (validatedData.rating) {
      const salonReviews = await prisma.review.findMany({
        where: { salonId: review.salonId },
        select: { rating: true }
      });

      const averageRating = salonReviews.reduce((sum, r) => sum + r.rating, 0) / salonReviews.length;
      
      await prisma.salon.update({
        where: { id: review.salonId },
        data: { rating: averageRating }
      });
    }

    res.json({
      success: true,
      data: updatedReview,
      message: 'Review updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
    });
  }
});

// DELETE /api/v1/reviews/:id - Delete a review
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const review = await prisma.review.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to delete it',
      });
    }

    await prisma.review.delete({
      where: { id }
    });

    // Update salon's average rating
    const salonReviews = await prisma.review.findMany({
      where: { salonId: review.salonId },
      select: { rating: true }
    });

    const averageRating = salonReviews.length > 0 
      ? salonReviews.reduce((sum, r) => sum + r.rating, 0) / salonReviews.length 
      : 0;
    
    await prisma.salon.update({
      where: { id: review.salonId },
      data: { 
        rating: averageRating,
        reviewCount: salonReviews.length
      }
    });

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
    });
  }
});

export default router;
