import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

/**
 * GET /api/v1/salon/dashboard/stats
 * Get dashboard statistics for the authenticated salon owner
 */
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Get user's salon
    const userWithSalon = await prisma.user.findUnique({
      where: { id: user.id },
      include: { ownedSalons: true }
    });

    if (!userWithSalon?.ownedSalons || userWithSalon.ownedSalons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No salon found for user'
      });
    }

    const salon = userWithSalon.ownedSalons[0];
    const salonId = salon.id;

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // "2025-12-05"

    // Get current time in HH:MM format
    const currentTime = today.toTimeString().slice(0, 5); // "14:30"

    // Fetch all stats in parallel
    const [
      todaysBookings,
      activeCustomers,
      todaysRevenue,
      avgServiceTime,
      todaysSchedule
    ] = await Promise.all([
      // Today's bookings count (bookings scheduled for today)
      prisma.booking.count({
        where: {
          salonId,
          date: todayStr
        }
      }),

      // Active customers (unique customers who have bookings)
      prisma.booking.findMany({
        where: { salonId },
        select: { userId: true },
        distinct: ['userId']
      }).then(bookings => bookings.length),

      // Today's revenue (from completed bookings today)
      prisma.booking.aggregate({
        where: {
          salonId,
          date: todayStr,
          status: 'COMPLETED'
        },
        _sum: { totalPrice: true }
      }),

      // Average service time (from all services)
      prisma.service.aggregate({
        where: { salonId },
        _avg: { duration: true }
      }),

      // Today's schedule (bookings for today, ordered by time)
      prisma.booking.findMany({
        where: {
          salonId,
          date: todayStr,
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        },
        orderBy: { time: 'asc' },
        take: 10,
        include: {
          user: {
            select: {
              name: true
            }
          },
          service: {
            select: {
              name: true,
              duration: true
            }
          }
        }
      })
    ]);

    // Format today's schedule
    const formattedTodaysSchedule = todaysSchedule.map(booking => ({
      id: booking.id,
      time: `${booking.date} ${booking.time}`,
      customerName: booking.user.name,
      serviceName: booking.service.name,
      duration: booking.service.duration
    }));

    res.json({
      success: true,
      data: {
        stats: {
          todaysBookings,
          activeCustomers,
          todaysRevenue: Number(todaysRevenue._sum.totalPrice) || 0,
          avgServiceTime: Math.round(avgServiceTime._avg.duration || 0)
        },
        upcomingBookings: formattedTodaysSchedule
      },
      message: 'Dashboard stats retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching salon dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
});

/**
 * GET /api/v1/salon/dashboard/insights
 * Get insights with optional date range filtering for salon owner
 */
router.get('/insights', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { startDate, endDate } = req.query;

    // Get user's salon
    const userWithSalon = await prisma.user.findUnique({
      where: { id: user.id },
      include: { ownedSalons: true }
    });

    if (!userWithSalon?.ownedSalons || userWithSalon.ownedSalons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No salon found for user'
      });
    }

    const salon = userWithSalon.ownedSalons[0];
    const salonId = salon.id;

    // Build date filter - if no dates provided, get all-time stats
    const dateFilter: { date?: { gte?: string; lte?: string } } = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = startDate as string;
      if (endDate) dateFilter.date.lte = endDate as string;
    }

    // Fetch insights in parallel
    const [
      totalBookingsResult,
      completedBookingsResult,
      pendingBookingsResult,
      cancelledBookingsResult,
      totalRevenueResult,
      avgBookingValueResult,
      topServicesResult,
      bookingsByStatusResult
    ] = await Promise.all([
      // Total bookings in date range
      prisma.booking.count({
        where: { salonId, ...dateFilter }
      }),

      // Completed bookings
      prisma.booking.count({
        where: { salonId, status: 'COMPLETED', ...dateFilter }
      }),

      // Pending bookings
      prisma.booking.count({
        where: { salonId, status: 'PENDING', ...dateFilter }
      }),

      // Cancelled bookings
      prisma.booking.count({
        where: { salonId, status: 'CANCELLED', ...dateFilter }
      }),

      // Total revenue from completed bookings
      prisma.booking.aggregate({
        where: { salonId, status: 'COMPLETED', ...dateFilter },
        _sum: { totalPrice: true }
      }),

      // Average booking value
      prisma.booking.aggregate({
        where: { salonId, status: 'COMPLETED', ...dateFilter },
        _avg: { totalPrice: true }
      }),

      // Top 5 most booked services
      prisma.booking.groupBy({
        by: ['serviceId'],
        where: { salonId, ...dateFilter },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      }),

      // Bookings by status for chart
      prisma.booking.groupBy({
        by: ['status'],
        where: { salonId, ...dateFilter },
        _count: { id: true }
      })
    ]);

    // Get service names for top services
    const topServices = await Promise.all(
      topServicesResult.map(async (item) => {
        const service = await prisma.service.findUnique({
          where: { id: item.serviceId },
          select: { name: true, price: true }
        });
        return {
          serviceName: service?.name || 'Unknown Service',
          price: service?.price || 0,
          bookingCount: item._count.id
        };
      })
    );

    // Format bookings by status
    const bookingsByStatus = bookingsByStatusResult.map(item => ({
      status: item.status,
      count: item._count.id
    }));

    // Calculate completion rate
    const completionRate = totalBookingsResult > 0
      ? Math.round((completedBookingsResult / totalBookingsResult) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalBookings: totalBookingsResult,
        completedBookings: completedBookingsResult,
        pendingBookings: pendingBookingsResult,
        cancelledBookings: cancelledBookingsResult,
        totalRevenue: Number(totalRevenueResult._sum.totalPrice) || 0,
        avgBookingValue: Math.round(Number(avgBookingValueResult._avg.totalPrice) || 0),
        completionRate,
        topServices,
        bookingsByStatus,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null,
          isAllTime: !startDate && !endDate
        }
      },
      message: 'Insights retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching salon insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insights'
    });
  }
});

export default router;

