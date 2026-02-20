import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@/config/database';
import { authenticateToken } from '@/middleware/simpleAuth';
import { requireAdmin, logAdminAction } from '@/middleware/adminAuth';
import { catchAsync } from '@/middleware/errorHandler';
import { createResponse } from '@/utils/helpers';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/types/auth';

const router = Router();

// Validation schemas
const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
  totalPrice: z.number().positive().optional(),
});

// Apply authentication and admin authorization
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/v1/admin/bookings - Get all bookings with pagination and filtering
 */
router.get('/', 
  logAdminAction('GET_BOOKINGS'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      salonId, 
      userId,
      startDate,
      endDate 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { user: { name: { contains: search as string, mode: 'insensitive' } } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } },
        { salon: { name: { contains: search as string, mode: 'insensitive' } } },
        { service: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (salonId) {
      where.salonId = salonId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) {
        where.appointmentDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.appointmentDate.lte = new Date(endDate as string);
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          salon: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true,
            },
          },
          stylist: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    logger.info('Admin fetched bookings', { 
      adminId: req.user.id, 
      page, 
      limit, 
      total 
    });

    return res.json(createResponse(true, {
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
      },
    }, 'Bookings retrieved successfully'));
  })
);

/**
 * GET /api/v1/admin/bookings/:id - Get booking by ID
 */
router.get('/:id', 
  logAdminAction('GET_BOOKING_DETAILS'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
          },
        },
        stylist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json(createResponse(false, null, 'Booking not found'));
    }

    logger.info('Admin fetched booking details', { 
      adminId: req.user.id, 
      bookingId: id 
    });

    return res.json(createResponse(true, booking, 'Booking details retrieved successfully'));
  })
);

/**
 * PATCH /api/v1/admin/bookings/:id - Update booking
 */
router.patch('/:id', 
  logAdminAction('UPDATE_BOOKING'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const validatedData = updateBookingSchema.parse(req.body);

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return res.status(404).json(createResponse(false, null, 'Booking not found'));
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
        stylist: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info('Admin updated booking', { 
      adminId: req.user.id, 
      bookingId: id,
      changes: validatedData 
    });

    return res.json(createResponse(true, updatedBooking, 'Booking updated successfully'));
  })
);

/**
 * DELETE /api/v1/admin/bookings/:id - Cancel/Delete booking
 */
router.delete('/:id', 
  logAdminAction('DELETE_BOOKING'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        salon: { select: { name: true } },
      },
    });

    if (!booking) {
      return res.status(404).json(createResponse(false, null, 'Booking not found'));
    }

    // Update booking status to cancelled instead of deleting
    await prisma.booking.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        notes: 'Cancelled by admin',
      },
    });

    logger.warn('Admin cancelled booking', { 
      adminId: req.user.id, 
      bookingId: id,
      userName: booking.user.name,
      salonName: booking.salon.name 
    });

    return res.json(createResponse(true, null, 'Booking cancelled successfully'));
  })
);

export default router;
