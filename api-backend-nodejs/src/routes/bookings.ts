import express, { Request, Response } from 'express';
import { PrismaClient, BookingStatus } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken } from '../middleware/simpleAuth';
import { BookingNotificationJobs, BookingConfirmedJobData } from '../queues/jobs/BookingNotificationJobs';
import { getConfigValue } from '../utils/systemConfigUtils';

// Helper function to generate 6-digit verification code
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to generate user confirmation code
const generateUserCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/bookings - Get user's own bookings
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        salon: {
          select: {
            id: true,
            displayId: true,
            name: true,
            address: true,
            phone: true,
            images: true,
          }
        },
        service: {
          select: {
            id: true,
            displayId: true,
            name: true,
            description: true,
            price: true,
            duration: true,
            category: true,
          }
        },
        subService: {
          select: {
            id: true,
            displayId: true,
            name: true,
            description: true,
            price: true,
            duration: true,
          }
        },
        stylist: {
          select: {
            id: true,
            displayId: true,
            name: true,
            avatar: true,
            specialties: true,
          }
        },
        bookingItems: {
          include: {
            service: {
              select: {
                id: true,
                displayId: true,
                name: true,
                description: true,
                price: true,
                duration: true,
                emoji: true,
              }
            },
            subService: {
              select: {
                id: true,
                displayId: true,
                name: true,
                description: true,
                price: true,
                duration: true,
              }
            },
            stylist: {
              select: {
                id: true,
                displayId: true,
                name: true,
                avatar: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: bookings,
      message: 'User bookings retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user bookings',
    });
  }
});

// Validation schemas
const bookingItemSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  subServiceId: z.string().optional(),
  stylistId: z.string().optional(),
});

const createBookingSchema = z.object({
  salonId: z.string().min(1, 'Salon ID is required'),
  // Support both single service (backward compatibility) and multiple services
  serviceId: z.string().min(1, 'Service ID is required').optional(),
  stylistId: z.string().optional(),
  subServiceId: z.string().optional(),
  // New field for multiple services
  services: z.array(bookingItemSchema).min(1, 'At least one service is required').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  notes: z.string().optional(),
  promoCode: z.string().optional(),
}).refine(
  (data) => data.serviceId || (data.services && data.services.length > 0),
  {
    message: 'Either serviceId or services array must be provided',
    path: ['serviceId'],
  }
);

const updateBookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  notes: z.string().optional(),
  rescheduleCount: z.number().min(0).optional(),
});

const verifyBookingSchema = z.object({
  verificationCode: z.string().length(6, 'Verification code must be 6 digits'),
  salonId: z.string().min(1, 'Salon ID is required'),
});

const confirmBookingSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
});

const completeBookingSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  userCode: z.string().length(6, 'User code must be 6 digits'),
});

// GET /api/v1/bookings/user/:userId - Get user's bookings
router.get('/user/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requestUserId = (req as any).user.userId;

    // Users can only access their own bookings
    if (userId !== requestUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own bookings.',
      });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            images: true,
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
            category: true,
          }
        },
        stylist: {
          select: {
            id: true,
            name: true,
            avatar: true,
            specialties: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: bookings,
      message: 'Bookings retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
    });
  }
});

// GET /api/v1/bookings/payment-config - Get payment configuration
router.get('/payment-config', async (req: Request, res: Response) => {
  try {
    const paymentRequired = await getConfigValue('payment_required_for_booking', 'true') === 'true';
    const paymentGatewayEnabled = await getConfigValue('payment_gateway_enabled', 'true') === 'true';
    const paymentTimeoutMinutes = parseInt(await getConfigValue('payment_timeout_minutes', '15'), 10);

    let supportedPaymentMethods = [];
    try {
      const methodsConfig = await getConfigValue('supported_payment_methods', '["razorpay", "cash"]');
      supportedPaymentMethods = JSON.parse(methodsConfig);
    } catch (error) {
      supportedPaymentMethods = ['razorpay', 'cash'];
    }

    res.json({
      success: true,
      data: {
        paymentRequired,
        paymentGatewayEnabled,
        paymentTimeoutMinutes,
        supportedPaymentMethods,
        // Derived configuration for frontend
        skipPaymentDialog: !paymentRequired || !paymentGatewayEnabled,
        directToRazorpay: paymentRequired && paymentGatewayEnabled,
      },
      message: 'Payment configuration retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching payment configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment configuration',
    });
  }
});

// POST /api/v1/bookings - Create a new booking
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const validatedData = createBookingSchema.parse(req.body);
    const userId = (req as any).user.id;

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please log in again.',
      });
    }

    // Verify salon exists (support both UUID and displayId)
    const isDisplayId = /^\d+$/.test(validatedData.salonId);
    const salon = await prisma.salon.findUnique({
      where: isDisplayId ? { displayId: parseInt(validatedData.salonId) } : { id: validatedData.salonId }
    });

    if (!salon) {
      return res.status(400).json({
        success: false,
        message: 'Salon not found',
      });
    }

    // Use the actual UUID for database operations
    const actualSalonId = salon.id;

    // Determine if this is a multi-service booking or single service booking
    const isMultiService = validatedData.services && validatedData.services.length > 0;

    // Prepare services array (either from services field or single service)
    const servicesToBook = isMultiService
      ? validatedData.services!
      : [{
          serviceId: validatedData.serviceId!,
          subServiceId: validatedData.subServiceId,
          stylistId: validatedData.stylistId,
        }];

    // Validate and fetch all services
    const serviceDetails = await Promise.all(
      servicesToBook.map(async (item) => {
        const isServiceDisplayId = /^\d+$/.test(item.serviceId);
        const service = await prisma.service.findFirst({
          where: {
            ...(isServiceDisplayId ? { displayId: parseInt(item.serviceId) } : { id: item.serviceId }),
            salonId: actualSalonId
          }
        });

        if (!service) {
          throw new Error(`Service ${item.serviceId} not found or does not belong to this salon`);
        }

        // Handle sub-service if provided
        let subService = null;
        if (item.subServiceId) {
          const isSubServiceDisplayId = /^\d+$/.test(item.subServiceId);
          subService = await prisma.subService.findFirst({
            where: {
              ...(isSubServiceDisplayId ? { displayId: parseInt(item.subServiceId) } : { id: item.subServiceId }),
              serviceId: service.id
            }
          });

          if (!subService) {
            throw new Error(`Sub-service ${item.subServiceId} not found`);
          }
        }

        // Handle stylist if provided
        let stylist = null;
        if (item.stylistId) {
          const isStylistDisplayId = /^\d+$/.test(item.stylistId);
          stylist = await prisma.stylist.findFirst({
            where: {
              ...(isStylistDisplayId ? { displayId: parseInt(item.stylistId) } : { id: item.stylistId }),
              salonId: actualSalonId
            }
          });

          if (!stylist) {
            throw new Error(`Stylist ${item.stylistId} not found or does not belong to this salon`);
          }
        }

        return {
          service,
          subService,
          stylist,
          originalItem: item
        };
      })
    );

    // Calculate total duration and price
    let totalDuration = 0;
    let totalPrice = 0;

    serviceDetails.forEach(({ service, subService }) => {
      const price = subService ? Number(subService.price) : Number(service.price);
      const duration = subService ? subService.duration : service.duration;

      totalPrice += price;
      totalDuration += duration;
    });

    // Apply promo code discount if provided
    let discount = 0;
    if (validatedData.promoCode) {
      const validPromoCodes: { [key: string]: number } = {
        'SAVE10': 10,
        'FIRST20': 20,
        'WELCOME15': 15,
      };

      const discountPercent = validPromoCodes[validatedData.promoCode.toUpperCase()];
      if (discountPercent) {
        discount = (totalPrice * discountPercent) / 100;
        totalPrice = totalPrice - discount;
      }
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // All bookings start as PENDING and require salon confirmation
    let initialStatus: BookingStatus = BookingStatus.PENDING;

    // Get display IDs for the booking
    const userDisplayData = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayId: true }
    });

    // Use first service as primary service for backward compatibility
    const primaryService = serviceDetails[0];

    // Create the booking with booking items
    const booking = await prisma.booking.create({
      data: {
        userId,
        userDisplayId: userDisplayData?.displayId,
        salonId: actualSalonId,
        salonDisplayId: salon.displayId,
        // Primary service (first service for backward compatibility)
        serviceId: primaryService.service.id,
        serviceDisplayId: primaryService.service.displayId,
        subServiceId: primaryService.subService?.id,
        subServiceDisplayId: primaryService.subService?.displayId,
        stylistId: primaryService.stylist?.id,
        stylistDisplayId: primaryService.stylist?.displayId,
        date: validatedData.date,
        time: validatedData.time,
        duration: totalDuration,
        totalPrice,
        discount,
        notes: validatedData.notes,
        promoCode: validatedData.promoCode,
        verificationCode,
        status: initialStatus,
        // Create booking items for all services
        bookingItems: {
          create: serviceDetails.map(({ service, subService, stylist }) => ({
            serviceId: service.id,
            serviceDisplayId: service.displayId,
            subServiceId: subService?.id,
            subServiceDisplayId: subService?.displayId,
            stylistId: stylist?.id,
            stylistDisplayId: stylist?.displayId,
            duration: subService ? subService.duration : service.duration,
            price: subService ? subService.price : service.price,
          }))
        }
      },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            images: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              }
            }
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
            category: true,
          }
        },
        subService: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
          }
        },
        stylist: {
          select: {
            id: true,
            name: true,
            avatar: true,
            specialties: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        bookingItems: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                duration: true,
                emoji: true,
              }
            },
            subService: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                duration: true,
              }
            },
            stylist: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          }
        }
      }
    });

    // Dispatch booking created notification job
    try {
      // Create service names list for multi-service bookings
      const serviceNamesArray = (booking as any).bookingItems
        .map((item: any) => item.subService?.name || item.service.name);

      // Use smart truncation for SMS (max 40 chars)
      const { truncateServiceNames } = await import('../utils');
      const serviceNames = truncateServiceNames(serviceNamesArray);

      await BookingNotificationJobs.addBookingCreatedJob({
        bookingId: booking.id,
        userId: booking.userId,
        salonId: booking.salonId,
        customerEmail: (booking as any).user.email,
        customerPhone: (booking as any).user.phone || undefined,
        customerName: (booking as any).user.name,
        salonOwnerEmail: (booking as any).salon.owner.email,
        salonOwnerPhone: (booking as any).salon.owner.phone || undefined,
        salonName: (booking as any).salon.name,
        serviceName: serviceNames,
        stylistName: (booking as any).stylist?.name || undefined,
        bookingDate: booking.date,
        bookingTime: booking.time,
        duration: booking.duration,
        totalPrice: Number(booking.totalPrice),
        verificationCode: booking.verificationCode,
        salonAddress: (booking as any).salon.address,
      });

      console.log(`📋 Booking created notification job queued for booking ${booking.id}`);
    } catch (queueError) {
      console.error('❌ Failed to queue booking created notification:', queueError);
      // Don't fail the booking creation if notification fails
    }

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
    });
  }
});

// GET /api/v1/bookings/:id - Get booking by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        userId // Users can only access their own bookings
      },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            images: true,
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
            category: true,
          }
        },
        stylist: {
          select: {
            id: true,
            name: true,
            avatar: true,
            specialties: true,
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
    });
  }
});

// PATCH /api/v1/bookings/:id - Update booking
router.patch('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const validatedData = updateBookingSchema.parse(req.body);

    // Check if booking exists and belongs to user
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id,
        userId
      },
      include: {
        salon: {
          select: {
            maxRescheduleLimit: true
          }
        }
      }
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Don't allow updates to completed or cancelled bookings
    if (existingBooking.status === 'COMPLETED' || existingBooking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed or cancelled bookings',
      });
    }

    // Check if this is a reschedule (date or time change)
    const isReschedule = (validatedData.date && validatedData.date !== existingBooking.date) ||
                        (validatedData.time && validatedData.time !== existingBooking.time);

    let updateData = { ...validatedData };

    if (isReschedule) {
      const maxRescheduleLimit = existingBooking.salon.maxRescheduleLimit || 3;

      // Check if reschedule limit has been reached
      if (existingBooking.rescheduleCount >= maxRescheduleLimit) {
        return res.status(400).json({
          success: false,
          message: `Maximum reschedule limit of ${maxRescheduleLimit} has been reached for this booking`,
        });
      }

      // Increment reschedule count
      updateData.rescheduleCount = existingBooking.rescheduleCount + 1;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            images: true,
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
            category: true,
          }
        },
        stylist: {
          select: {
            id: true,
            name: true,
            avatar: true,
            specialties: true,
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Booking updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
    });
  }
});

// DELETE /api/v1/bookings/:id - Cancel booking
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Check if booking exists and belongs to user
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Don't allow cancellation of completed bookings
    if (existingBooking.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed bookings',
      });
    }

    // Update status to cancelled instead of deleting
    const cancelledBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            images: true,
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
            category: true,
          }
        },
        stylist: {
          select: {
            id: true,
            name: true,
            avatar: true,
            specialties: true,
          }
        }
      }
    });

    res.json({
      success: true,
      data: cancelledBooking,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
    });
  }
});

// POST /api/v1/bookings/verify - Verify booking with verification code (for salon staff)
router.post('/verify', authenticateToken, async (req: Request, res: Response) => {
  try {
    const validatedData = verifyBookingSchema.parse(req.body);
    const userId = (req as any).user.userId;

    // Verify user exists and has appropriate role (salon owner or admin)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please log in again.',
      });
    }

    // Check if user has permission to verify bookings (salon owner or admin)
    if (user.role !== 'SALON_OWNER' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only salon owners and admins can verify bookings.',
      });
    }

    // Find booking by verification code and salon
    const isDisplayId = /^\d+$/.test(validatedData.salonId);
    const booking = await prisma.booking.findFirst({
      where: {
        verificationCode: validatedData.verificationCode,
        salon: isDisplayId
          ? { displayId: parseInt(validatedData.salonId) }
          : { id: validatedData.salonId }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          }
        },
        stylist: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'No booking found with this verification code for the specified salon.',
      });
    }

    // Update booking status to CONFIRMED if it's still PENDING
    if (booking.status === 'PENDING') {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CONFIRMED' }
      });
    }

    res.json({
      success: true,
      data: {
        ...booking,
        status: 'CONFIRMED'
      },
      message: 'Booking verified successfully',
    });
  } catch (error) {
    console.error('Error verifying booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify booking',
    });
  }
});

// GET /api/v1/bookings/salon/current - Get current salon's bookings
router.get('/salon/current', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get user's owned salons
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedSalons: {
          select: {
            id: true,
            displayId: true,
            name: true,
          }
        }
      }
    });

    console.log(`🔍 Debug salon bookings for user ${userId}:`, {
      userFound: !!user,
      ownedSalons: user?.ownedSalons?.length || 0,
      salons: user?.ownedSalons
    });

    if (!user || !user.ownedSalons || user.ownedSalons.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No salon found for this user',
      });
    }

    // Use the first salon (in the future, we can add salon selection)
    const salon = user.ownedSalons[0];

    // Get all bookings for this salon
    const bookings = await prisma.booking.findMany({
      where: {
        salonId: salon.id,
      },
      include: {
        user: {
          select: {
            id: true,
            displayId: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        salon: {
          select: {
            id: true,
            displayId: true,
            name: true,
            address: true,
            phone: true,
          }
        },
        service: {
          select: {
            id: true,
            displayId: true,
            name: true,
            duration: true,
            price: true,
          }
        },
        stylist: {
          select: {
            id: true,
            displayId: true,
            name: true,
            avatar: true,
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });

    console.log(`📋 Found ${bookings.length} bookings for salon ${salon.name} (ID: ${salon.displayId})`);

    res.json({
      success: true,
      data: bookings,
      salon: {
        id: salon.id,
        displayId: salon.displayId,
        name: salon.name,
      }
    });
  } catch (error) {
    console.error('Error fetching salon bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salon bookings',
    });
  }
});

// GET /api/v1/bookings/salon/:salonId - Get bookings for a specific salon (for salon owners)
router.get('/salon/:salonId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Check if user is salon owner or admin
    if (userRole !== 'SALON_OWNER' && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only salon owners can view salon bookings.',
      });
    }

    // Check if salonId is a number (displayId) or UUID
    const isDisplayId = /^\d+$/.test(salonId);

    // Verify salon exists and user owns it (unless admin)
    const salon = await prisma.salon.findUnique({
      where: isDisplayId ? { displayId: parseInt(salonId) } : { id: salonId },
      include: {
        owner: true
      }
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found',
      });
    }

    // Check ownership (unless admin)
    if (userRole === 'SALON_OWNER' && salon.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view bookings for your own salon.',
      });
    }

    const bookings = await prisma.booking.findMany({
      where: { salonId: salon.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
            category: true,
          }
        },
        stylist: {
          select: {
            id: true,
            name: true,
            avatar: true,
            specialties: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: bookings,
      message: 'Salon bookings retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching salon bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salon bookings',
    });
  }
});

// POST /api/v1/bookings/:id/confirm - Salon confirms booking and generates user code
router.post('/:id/confirm', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id: bookingId } = req.params;
    const userId = (req as any).user.id;

    // Get the booking with salon information
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        service: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if user is the salon owner
    if (booking.salon.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only salon owners can confirm bookings',
      });
    }

    // Check if booking is in PENDING status
    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status.toLowerCase()}`,
      });
    }

    // Generate user code and update booking
    const userCode = generateUserCode();

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        userCode,
      },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          }
        },
        stylist: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        },
        bookingItems: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
              }
            },
            subService: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    console.log(`✅ Booking ${bookingId} confirmed by salon ${booking.salon.name}`);
    console.log(`🔑 User code generated: ${userCode} for user ${booking.user.name}`);

    // Queue booking confirmed notification job
    try {
      // Get service names from bookingItems (multi-service support)
      const serviceNamesArray = (updatedBooking as any).bookingItems
        .map((item: any) => item.subService?.name || item.service.name);

      // Use smart truncation for SMS (max 40 chars)
      const { truncateServiceNames } = await import('../utils');
      const serviceNames = truncateServiceNames(serviceNamesArray);

      const notificationData: BookingConfirmedJobData = {
        bookingId: updatedBooking.id,
        customerName: updatedBooking.user.name,
        customerEmail: updatedBooking.user.email,
        customerPhone: updatedBooking.user.phone,
        salonName: updatedBooking.salon.name,
        salonAddress: updatedBooking.salon.address || '',
        serviceName: serviceNames,
        stylistName: updatedBooking.stylist?.name,
        bookingDate: updatedBooking.date,
        bookingTime: updatedBooking.time,
        duration: updatedBooking.duration,
        totalPrice: parseFloat(updatedBooking.totalPrice.toString()),
        userCode: userCode,
      };

      await BookingNotificationJobs.addBookingConfirmedJob(notificationData);
      console.log(`📋 Booking confirmed notification job queued for booking ${bookingId}`);
    } catch (error) {
      console.error(`❌ Failed to queue booking confirmed notification for booking ${bookingId}:`, error);
      // Don't fail the request if notification queueing fails
    }

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Booking confirmed successfully. User code generated.',
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm booking',
    });
  }
});

// POST /api/v1/bookings/:id/complete - Mark booking as completed using user code
router.post('/:id/complete', authenticateToken, async (req: Request, res: Response) => {
  try {
    const validatedData = completeBookingSchema.parse(req.body);
    const { id: bookingId } = req.params;
    const { userCode } = validatedData;
    const userId = (req as any).user.id;

    // Get the booking with salon information
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if user is the salon owner
    if (booking.salon.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only salon owners can complete bookings',
      });
    }

    // Check if booking is confirmed
    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Booking must be confirmed before it can be completed',
      });
    }

    // Check if user code matches
    if (booking.userCode !== userCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user code',
      });
    }

    // Update booking status to completed
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'COMPLETED',
      },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
          }
        }
      }
    });

    console.log(`✅ Booking ${bookingId} completed for user ${booking.user.name} at ${booking.salon.name}`);

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Booking completed successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error completing booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete booking',
    });
  }
});

export default router;
