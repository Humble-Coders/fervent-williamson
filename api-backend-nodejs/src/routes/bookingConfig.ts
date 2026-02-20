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

// Validation schema for booking configuration
const updateBookingConfigSchema = z.object({
  slotDuration: z.number().min(15).max(180).optional(),
  breakDuration: z.number().min(0).max(60).optional(),
  advanceBookingDays: z.number().min(1).max(365).optional(),
  minimumNoticeHours: z.number().min(0).max(72).optional(), // Accepts decimals (e.g., 0.5 = 30 mins)
  bufferTime: z.number().min(0).max(60).optional(),
  maxBookingsPerDay: z.number().min(1).max(100).optional().nullable(), // Allow null for unlimited
  allowSameDayBooking: z.boolean().optional(),
  maxRescheduleLimit: z.number().min(0).max(10).optional(),
  enabledPaymentMethods: z.array(z.string()).optional(),
});

// GET /api/v1/booking-config/:salonId - Get booking configuration for a salon
router.get('/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    // Check if salonId is a number (displayId) or UUID
    const isDisplayId = /^\d+$/.test(salonId);

    const salon = await prisma.salon.findUnique({
      where: isDisplayId ? { displayId: parseInt(salonId) } : { id: salonId },
      select: {
        id: true,
        displayId: true,
        name: true,
        slotDuration: true,
        breakDuration: true,
        advanceBookingDays: true,
        minimumNoticeHours: true,
        bufferTime: true,
        maxBookingsPerDay: true,
        allowSameDayBooking: true,
        maxRescheduleLimit: true,
        enabledPaymentMethods: true,
        workingHours: true,
      },
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found',
      });
    }

    // Get available payment methods from global config
    const availablePaymentMethods = await prisma.paymentMethodConfig.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    // Filter enabled payment methods for this salon
    const enabledPaymentMethods = availablePaymentMethods.filter(pm => 
      salon.enabledPaymentMethods.includes(pm.type)
    );

    // Generate time slots based on salon configuration
    const timeSlots = generateTimeSlots(salon);

    const bookingConfig = {
      salon: {
        id: salon.id,
        displayId: salon.displayId,
        name: salon.name,
      },
      slotDuration: salon.slotDuration || 30,
      breakDuration: salon.breakDuration || 0,
      advanceBookingDays: salon.advanceBookingDays || 30,
      minimumNoticeHours: salon.minimumNoticeHours || 2,
      bufferTime: salon.bufferTime || 15,
      maxBookingsPerDay: salon.maxBookingsPerDay || 20,
      allowSameDayBooking: salon.allowSameDayBooking,
      maxRescheduleLimit: salon.maxRescheduleLimit || 3,
      workingHours: salon.workingHours,
      paymentMethods: enabledPaymentMethods,
      timeSlots,
    };

    res.json({
      success: true,
      data: bookingConfig,
      message: 'Booking configuration retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching booking configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking configuration',
    });
  }
});

// PUT /api/v1/booking-config/:salonId - Update booking configuration (Admin or Salon Owner)
router.put('/:salonId', simpleAuth, async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const user = (req as any).user;
    const validatedData = updateBookingConfigSchema.parse(req.body);

    // Check if salon exists
    const existingSalon = await prisma.salon.findUnique({
      where: { id: salonId },
    });

    if (!existingSalon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found',
      });
    }

    // Check permissions: Admin can edit any salon, salon owner can edit their own
    if (user.role !== 'ADMIN' && existingSalon.ownerId !== user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own salon configuration',
      });
    }

    // Validate enabled payment methods against available ones
    if (validatedData.enabledPaymentMethods) {
      const availablePaymentMethods = await prisma.paymentMethodConfig.findMany({
        where: { isActive: true },
        select: { type: true }
      });

      const availableTypes = availablePaymentMethods.map(pm => pm.type);
      const invalidMethods = validatedData.enabledPaymentMethods.filter(
        method => !availableTypes.includes(method)
      );

      if (invalidMethods.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid payment methods: ${invalidMethods.join(', ')}`,
        });
      }
    }

    const updatedSalon = await prisma.salon.update({
      where: { id: salonId },
      data: validatedData,
      select: {
        id: true,
        displayId: true,
        name: true,
        slotDuration: true,
        breakDuration: true,
        advanceBookingDays: true,
        minimumNoticeHours: true,
        bufferTime: true,
        maxBookingsPerDay: true,
        allowSameDayBooking: true,
        maxRescheduleLimit: true,
        enabledPaymentMethods: true,
        workingHours: true,
      },
    });

    res.json({
      success: true,
      data: updatedSalon,
      message: 'Booking configuration updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error updating booking configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking configuration',
    });
  }
});

// Helper function to generate time slots based on salon configuration
function generateTimeSlots(salon: any): string[] {
  const slots: string[] = [];
  const slotDuration = salon.slotDuration || 30;
  const bufferTime = salon.bufferTime || 0;

  // Total interval = service duration + buffer time between appointments
  const totalInterval = slotDuration + bufferTime;

  // Use working hours to determine start and end time
  // For simplicity, use the first day's hours that is open
  const workingHours = salon.workingHours as any;
  let startTime = '09:00';
  let endTime = '18:00';

  if (workingHours) {
    // Find the first open day
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of days) {
      if (workingHours[day]?.isOpen) {
        startTime = workingHours[day].open || '09:00';
        endTime = workingHours[day].close || '18:00';
        break;
      }
    }
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  let currentHour = startHour;
  let currentMinute = startMinute;

  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    slots.push(timeString);

    // Add total interval (slot duration + buffer time)
    currentMinute += totalInterval;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return slots;
}

export default router;
