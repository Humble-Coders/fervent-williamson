import { Response } from 'express';
import { prisma } from '@/config/database';
import { catchAsync } from '@/middleware/errorHandler';
import { createResponse } from '@/utils/helpers';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/types/auth';

export class AdminStatsController {
  /**
   * Get admin dashboard statistics
   */
  getDashboardStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const [
      totalUsers,
      activeUsers,
      totalSalons,
      activeSalons,
      totalBookings,
      totalRevenue,
      recentUsers,
      recentBookings,
      monthlyStats,
      topSalonsByRevenue,
      topSalonsByBookings,
      bookingStatusDistribution,
    ] = await Promise.all([
      // Basic counts
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.salon.count(),
      prisma.salon.count({ where: { isOpen: true } }),
      prisma.booking.count(),

      // Revenue calculation
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: { status: 'COMPLETED' },
      }),

      // Recent users
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),

      // Recent bookings
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: { select: { name: true, email: true } },
          salon: { select: { name: true } },
          service: { select: { name: true } },
        },
      }),

      // Monthly statistics for the last 12 months
      this.getMonthlyStats(),

      // Top 5 Salons by Revenue
      prisma.booking.groupBy({
        by: ['salonId'],
        _sum: { totalPrice: true },
        where: { status: 'COMPLETED' },
        orderBy: {
          _sum: { totalPrice: 'desc' },
        },
        take: 5,
      }).then(async (results) => {
        const salonIds = results.map(r => r.salonId);
        const salons = await prisma.salon.findMany({
          where: { id: { in: salonIds } },
          select: { id: true, name: true }
        });
        return results.map(r => ({
          id: r.salonId,
          name: salons.find(s => s.id === r.salonId)?.name || 'Unknown Salon',
          revenue: Number(r._sum.totalPrice) || 0
        }));
      }),

      // Top 5 Salons by Booking Count
      prisma.booking.groupBy({
        by: ['salonId'],
        _count: { id: true },
        orderBy: {
          _count: { id: 'desc' },
        },
        take: 5,
      }).then(async (results) => {
        const salonIds = results.map(r => r.salonId);
        const salons = await prisma.salon.findMany({
          where: { id: { in: salonIds } },
          select: { id: true, name: true }
        });
        return results.map(r => ({
          id: r.salonId,
          name: salons.find(s => s.id === r.salonId)?.name || 'Unknown Salon',
          count: r._count.id
        }));
      }),

      // Booking Status Distribution
      prisma.booking.groupBy({
        by: ['status'],
        _count: { id: true },
      })
    ]);

    const stats = {
      overview: {
        totalUsers,
        activeUsers,
        totalSalons,
        activeSalons,
        totalBookings,
        totalRevenue: Number(totalRevenue._sum.totalPrice) || 0,
      },
      recent: {
        users: recentUsers,
        bookings: recentBookings,
      },
      monthly: monthlyStats,
      topSalonsByRevenue,
      topSalonsByBookings,
      bookingStatusDistribution: bookingStatusDistribution.map(item => ({
        status: item.status,
        count: item._count.id
      })),
    };

    logger.info('Admin dashboard stats retrieved', {
      adminId: req.user.id
    });

    return res.json(createResponse(true, stats, 'Dashboard stats retrieved successfully'));
  });

  /**
   * Get user statistics
   */
  getUserStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { period = '30d' } = req.query;
    const dateFilter = this.getDateFilter(period as string);

    const [
      usersByRole,
      userGrowth,
      activeUsersByDay,
      topUsers,
    ] = await Promise.all([
      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
        where: dateFilter,
      }),

      // User growth over time
      this.getUserGrowthStats(period as string),

      // Active users by day
      this.getActiveUsersByDay(period as string),

      // Top users by bookings
      prisma.user.findMany({
        where: {
          ...dateFilter,
          bookings: { some: {} },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
        orderBy: {
          bookings: {
            _count: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    const stats = {
      usersByRole,
      userGrowth,
      activeUsersByDay,
      topUsers,
    };

    return res.json(createResponse(true, stats, 'User stats retrieved successfully'));
  });

  /**
   * Get salon statistics
   */
  getSalonStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { period = '30d' } = req.query;
    const dateFilter = this.getDateFilter(period as string);

    const [
      salonsByStatus,
      topSalons,
      salonGrowth,
      averageRatings,
    ] = await Promise.all([
      // Salons by status
      prisma.salon.groupBy({
        by: ['isOpen', 'featured'],
        _count: { id: true },
        where: dateFilter,
      }),

      // Top salons by bookings
      prisma.salon.findMany({
        where: {
          ...dateFilter,
          bookings: { some: {} },
        },
        select: {
          id: true,
          name: true,
          address: true,
          rating: true,
          featured: true,
          isOpen: true,
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
        orderBy: {
          bookings: {
            _count: 'desc',
          },
        },
        take: 10,
      }),

      // Salon growth
      this.getSalonGrowthStats(period as string),

      // Average ratings
      prisma.salon.aggregate({
        _avg: { rating: true },
        _count: { id: true },
        where: {
          ...dateFilter,
          rating: { gt: 0 },
        },
      }),
    ]);

    const stats = {
      salonsByStatus,
      topSalons,
      salonGrowth,
      averageRating: averageRatings._avg.rating || 0,
      totalRatedSalons: averageRatings._count.id,
    };

    return res.json(createResponse(true, stats, 'Salon stats retrieved successfully'));
  });

  /**
   * Get booking statistics
   */
  getBookingStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { period = '30d' } = req.query;
    const dateFilter = this.getDateFilter(period as string);

    const [
      bookingsByStatus,
      bookingsByDay,
      revenueByDay,
      popularServices,
    ] = await Promise.all([
      // Bookings by status
      prisma.booking.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { totalPrice: true },
        where: dateFilter,
      }),

      // Bookings by day
      this.getBookingsByDay(period as string),

      // Revenue by day
      this.getRevenueByDay(period as string),

      // Popular services
      prisma.service.findMany({
        where: {
          bookings: {
            some: dateFilter,
          },
        },
        select: {
          id: true,
          name: true,
          price: true,
          duration: true,
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy: {
          bookings: {
            _count: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    const stats = {
      bookingsByStatus,
      bookingsByDay,
      revenueByDay,
      popularServices,
    };

    return res.json(createResponse(true, stats, 'Booking stats retrieved successfully'));
  });

  // Helper methods
  private getDateFilter(period: string) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      createdAt: {
        gte: startDate,
      },
    };
  }

  private async getMonthlyStats() {
    // Implementation for monthly statistics
    // This would involve complex date grouping queries
    return [];
  }

  private async getUserGrowthStats(period: string) {
    // Implementation for user growth statistics
    return [];
  }

  private async getActiveUsersByDay(period: string) {
    // Implementation for active users by day
    return [];
  }

  private async getSalonGrowthStats(period: string) {
    // Implementation for salon growth statistics
    return [];
  }

  private async getBookingsByDay(period: string) {
    // Implementation for bookings by day
    return [];
  }

  private async getRevenueByDay(period: string) {
    // Implementation for revenue by day
    return [];
  }
}
