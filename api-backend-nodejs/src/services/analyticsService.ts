import { PrismaClient, AnalyticsEventType, DeviceType, UserRole } from '@prisma/client';
import {
  CreateAnalyticsEventData,
  AnalyticsQueryFilters,
  AnalyticsAggregation,
  BusinessMetrics,
  RealTimeMetrics,
  AnalyticsDashboardData,
  SessionAnalytics,
  ErrorAnalytics
} from '../types/analytics';

export class AnalyticsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Record a new analytics event
   */
  async recordEvent(data: CreateAnalyticsEventData): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId,
          eventType: data.eventType,
          page: data.page,
          action: data.action,
          salonId: data.salonId,
          salonDisplayId: data.salonDisplayId,
          serviceId: data.serviceId,
          serviceDisplayId: data.serviceDisplayId,
          stylistId: data.stylistId,
          stylistDisplayId: data.stylistDisplayId,
          bookingId: data.bookingId,
          bookingDisplayId: data.bookingDisplayId,
          userRole: data.userRole,
          deviceType: data.deviceType,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          referrer: data.referrer,
          metadata: data.metadata,
          duration: data.duration,
          errorCode: data.errorCode,
          errorMessage: data.errorMessage,
        },
      });
    } catch (error) {
      console.error('Failed to record analytics event:', error);
      // Don't throw error to avoid breaking the main application flow
    }
  }

  /**
   * Record multiple events in batch
   */
  async recordEventsBatch(events: CreateAnalyticsEventData[]): Promise<void> {
    try {
      await this.prisma.analyticsEvent.createMany({
        data: events.map(event => ({
          userId: event.userId,
          sessionId: event.sessionId,
          eventType: event.eventType,
          page: event.page,
          action: event.action,
          salonId: event.salonId,
          salonDisplayId: event.salonDisplayId,
          serviceId: event.serviceId,
          serviceDisplayId: event.serviceDisplayId,
          stylistId: event.stylistId,
          stylistDisplayId: event.stylistDisplayId,
          bookingId: event.bookingId,
          bookingDisplayId: event.bookingDisplayId,
          userRole: event.userRole,
          deviceType: event.deviceType,
          userAgent: event.userAgent,
          ipAddress: event.ipAddress,
          referrer: event.referrer,
          metadata: event.metadata,
          duration: event.duration,
          errorCode: event.errorCode,
          errorMessage: event.errorMessage,
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      console.error('Failed to record analytics events batch:', error);
    }
  }

  /**
   * Get analytics events with filters
   */
  async getEvents(filters: AnalyticsQueryFilters) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.sessionId) where.sessionId = filters.sessionId;
    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.page) where.page = { contains: filters.page, mode: 'insensitive' };
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.salonId) where.salonId = filters.salonId;
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.stylistId) where.stylistId = filters.stylistId;
    if (filters.bookingId) where.bookingId = filters.bookingId;
    if (filters.userRole) where.userRole = filters.userRole;
    if (filters.deviceType) where.deviceType = filters.deviceType;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return await this.prisma.analyticsEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
      // Note: AnalyticsEvent model doesn't have relations defined, so no include needed
    });
  }

  /**
   * Get aggregated analytics data
   */
  async getAggregatedData(filters: AnalyticsQueryFilters): Promise<AnalyticsAggregation> {
    const where: any = {};
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [
      totalEvents,
      uniqueUsers,
      uniqueSessions,
      avgDuration,
      topPages,
      topActions,
      deviceBreakdown,
      userRoleBreakdown
    ] = await Promise.all([
      // Total events
      this.prisma.analyticsEvent.count({ where }),
      
      // Unique users
      this.prisma.analyticsEvent.findMany({
        where,
        select: { userId: true },
        distinct: ['userId']
      }).then(results => results.filter(r => r.userId).length),
      
      // Unique sessions
      this.prisma.analyticsEvent.findMany({
        where,
        select: { sessionId: true },
        distinct: ['sessionId']
      }).then(results => results.length),
      
      // Average duration
      this.prisma.analyticsEvent.aggregate({
        where: { ...where, duration: { not: null } },
        _avg: { duration: true }
      }).then(result => result._avg.duration),
      
      // Top pages
      this.prisma.analyticsEvent.groupBy({
        by: ['page'],
        where,
        _count: { page: true },
        orderBy: { _count: { page: 'desc' } },
        take: 10
      }),
      
      // Top actions
      this.prisma.analyticsEvent.groupBy({
        by: ['action'],
        where: { ...where, action: { not: null } },
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),
      
      // Device breakdown
      this.prisma.analyticsEvent.groupBy({
        by: ['deviceType'],
        where: { ...where, deviceType: { not: null } },
        _count: { deviceType: true }
      }),
      
      // User role breakdown
      this.prisma.analyticsEvent.groupBy({
        by: ['userRole'],
        where: { ...where, userRole: { not: null } },
        _count: { userRole: true }
      })
    ]);

    return {
      totalEvents,
      uniqueUsers,
      uniqueSessions,
      averageDuration: avgDuration || undefined,
      topPages: topPages.map(p => ({ page: p.page, count: p._count.page })),
      topActions: topActions.map(a => ({ action: a.action!, count: a._count.action })),
      deviceBreakdown: deviceBreakdown.map(d => ({ 
        deviceType: d.deviceType!, 
        count: d._count.deviceType 
      })),
      userRoleBreakdown: userRoleBreakdown.map(u => ({ 
        userRole: u.userRole!, 
        count: u._count.userRole 
      }))
    };
  }

  /**
   * Get session analytics for a specific session
   */
  async getSessionAnalytics(sessionId: string): Promise<SessionAnalytics | null> {
    const events = await this.prisma.analyticsEvent.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      // Note: AnalyticsEvent model doesn't have relations defined, so no include needed
    });

    if (events.length === 0) return null;

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const pageViews = events.filter(e => e.eventType === AnalyticsEventType.PAGE_VIEW);
    const actions = events.filter(e => e.eventType === AnalyticsEventType.ACTION);
    const conversions = events.filter(e => e.eventType === AnalyticsEventType.CONVERSION);

    const duration = lastEvent.createdAt.getTime() - firstEvent.createdAt.getTime();

    return {
      sessionId,
      userId: firstEvent.userId || undefined,
      userRole: firstEvent.userRole || undefined,
      deviceType: firstEvent.deviceType || undefined,
      startTime: firstEvent.createdAt,
      endTime: lastEvent.createdAt,
      duration: Math.floor(duration / 1000), // Convert to seconds
      pageViews: pageViews.length,
      actions: actions.length,
      conversions: conversions.length,
      pages: pageViews.map(pv => ({
        page: pv.page,
        timestamp: pv.createdAt,
        duration: pv.duration || undefined
      })),
      userAgent: firstEvent.userAgent || undefined,
      ipAddress: firstEvent.ipAddress || undefined,
      referrer: firstEvent.referrer || undefined
    };
  }

  /**
   * Get business intelligence metrics
   */
  async getBusinessMetrics(filters: AnalyticsQueryFilters): Promise<BusinessMetrics> {
    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    // Booking funnel analysis
    const [salonViews, serviceViews, stylistViews, bookingAttempts, bookingCompletions] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: { ...where, page: { contains: '/salons/' } }
      }),
      this.prisma.analyticsEvent.count({
        where: { ...where, page: { contains: '/services/' } }
      }),
      this.prisma.analyticsEvent.count({
        where: { ...where, page: { contains: '/stylists/' } }
      }),
      this.prisma.analyticsEvent.count({
        where: { ...where, action: 'booking_attempt' }
      }),
      this.prisma.analyticsEvent.count({
        where: { ...where, eventType: AnalyticsEventType.CONVERSION, action: 'booking_completed' }
      })
    ]);

    const conversionRate = salonViews > 0 ? (bookingCompletions / salonViews) * 100 : 0;

    // Popular salons with conversion rates
    const popularSalonsData = await this.prisma.analyticsEvent.groupBy({
      by: ['salonId', 'salonDisplayId'],
      where: { ...where, salonId: { not: null } },
      _count: { salonId: true },
      orderBy: { _count: { salonId: 'desc' } },
      take: 10
    });

    const popularSalons = await Promise.all(
      popularSalonsData.map(async (salon) => {
        const salonData = await this.prisma.salon.findUnique({
          where: { id: salon.salonId! },
          select: { name: true }
        });

        const bookings = await this.prisma.analyticsEvent.count({
          where: {
            ...where,
            salonId: salon.salonId,
            eventType: AnalyticsEventType.CONVERSION,
            action: 'booking_completed'
          }
        });

        return {
          salonId: salon.salonId!,
          salonName: salonData?.name || 'Unknown',
          displayId: salon.salonDisplayId || 0,
          views: salon._count.salonId,
          bookings,
          conversionRate: salon._count.salonId > 0 ? (bookings / salon._count.salonId) * 100 : 0
        };
      })
    );

    // Similar logic for services and stylists...
    const popularServicesData = await this.prisma.analyticsEvent.groupBy({
      by: ['serviceId', 'serviceDisplayId'],
      where: { ...where, serviceId: { not: null } },
      _count: { serviceId: true },
      orderBy: { _count: { serviceId: 'desc' } },
      take: 10
    });

    const popularServices = await Promise.all(
      popularServicesData.map(async (service) => {
        const serviceData = await this.prisma.service.findUnique({
          where: { id: service.serviceId! },
          select: { name: true }
        });

        const bookings = await this.prisma.analyticsEvent.count({
          where: {
            ...where,
            serviceId: service.serviceId,
            eventType: AnalyticsEventType.CONVERSION,
            action: 'booking_completed'
          }
        });

        return {
          serviceId: service.serviceId!,
          serviceName: serviceData?.name || 'Unknown',
          displayId: service.serviceDisplayId || 0,
          views: service._count.serviceId,
          bookings,
          conversionRate: service._count.serviceId > 0 ? (bookings / service._count.serviceId) * 100 : 0
        };
      })
    );

    const popularStylistsData = await this.prisma.analyticsEvent.groupBy({
      by: ['stylistId', 'stylistDisplayId'],
      where: { ...where, stylistId: { not: null } },
      _count: { stylistId: true },
      orderBy: { _count: { stylistId: 'desc' } },
      take: 10
    });

    const popularStylists = await Promise.all(
      popularStylistsData.map(async (stylist) => {
        const stylistData = await this.prisma.stylist.findUnique({
          where: { id: stylist.stylistId! },
          select: { name: true }
        });

        const bookings = await this.prisma.analyticsEvent.count({
          where: {
            ...where,
            stylistId: stylist.stylistId,
            eventType: AnalyticsEventType.CONVERSION,
            action: 'booking_completed'
          }
        });

        return {
          stylistId: stylist.stylistId!,
          stylistName: stylistData?.name || 'Unknown',
          displayId: stylist.stylistDisplayId || 0,
          views: stylist._count.stylistId,
          bookings,
          conversionRate: stylist._count.stylistId > 0 ? (bookings / stylist._count.stylistId) * 100 : 0
        };
      })
    );

    // User engagement metrics
    const sessions = await this.prisma.analyticsEvent.groupBy({
      by: ['sessionId'],
      where,
      _count: { sessionId: true },
      _avg: { duration: true }
    });

    const averageSessionDuration = sessions.reduce((acc, s) => acc + (s._avg.duration || 0), 0) / sessions.length;
    const averagePagesPerSession = sessions.reduce((acc, s) => acc + s._count.sessionId, 0) / sessions.length;

    // Peak times analysis
    const hourlyData = await this.prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
      SELECT EXTRACT(HOUR FROM "createdAt") as hour, COUNT(*) as count
      FROM "analytics_events"
      WHERE "createdAt" >= ${filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
      AND "createdAt" <= ${filters.endDate || new Date()}
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY count DESC
    `;

    const peakHours = hourlyData.map(h => ({ hour: h.hour, count: Number(h.count) }));

    const dailyData = await this.prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
      SELECT TO_CHAR("createdAt", 'Day') as day, COUNT(*) as count
      FROM "analytics_events"
      WHERE "createdAt" >= ${filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
      AND "createdAt" <= ${filters.endDate || new Date()}
      GROUP BY TO_CHAR("createdAt", 'Day')
      ORDER BY count DESC
    `;

    const peakDays = dailyData.map(d => ({ day: d.day.trim(), count: Number(d.count) }));

    return {
      bookingFunnel: {
        salonViews,
        serviceViews,
        stylistViews,
        bookingAttempts,
        bookingCompletions,
        conversionRate
      },
      popularSalons,
      popularServices,
      popularStylists,
      userEngagement: {
        averageSessionDuration,
        averagePagesPerSession,
        bounceRate: 0, // Calculate based on single-page sessions
        returnUserRate: 0 // Calculate based on repeat users
      },
      peakHours,
      peakDays
    };
  }

  /**
   * Get real-time analytics metrics
   */
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);

    const [activeUsers, activeSessions, currentPageViews, recentActions] = await Promise.all([
      // Active users in last 5 minutes
      this.prisma.analyticsEvent.findMany({
        where: {
          createdAt: { gte: fiveMinutesAgo },
          userId: { not: null }
        },
        select: { userId: true },
        distinct: ['userId']
      }).then(results => results.length),

      // Active sessions in last 5 minutes
      this.prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: fiveMinutesAgo } },
        select: { sessionId: true },
        distinct: ['sessionId']
      }).then(results => results.length),

      // Current page views in last minute
      this.prisma.analyticsEvent.groupBy({
        by: ['page'],
        where: {
          createdAt: { gte: oneMinuteAgo },
          eventType: AnalyticsEventType.PAGE_VIEW
        },
        _count: { page: true },
        orderBy: { _count: { page: 'desc' } },
        take: 10
      }),

      // Recent actions in last minute
      this.prisma.analyticsEvent.findMany({
        where: {
          createdAt: { gte: oneMinuteAgo },
          eventType: { in: [AnalyticsEventType.ACTION, AnalyticsEventType.CONVERSION] }
        },
        select: {
          eventType: true,
          page: true,
          action: true,
          createdAt: true,
          userRole: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ]);

    return {
      activeUsers,
      activeSessions,
      currentPageViews: currentPageViews.map(p => ({ page: p.page, count: p._count.page })),
      recentActions: recentActions.map(a => ({
        eventType: a.eventType,
        page: a.page,
        action: a.action || undefined,
        timestamp: a.createdAt,
        userRole: a.userRole || undefined
      }))
    };
  }

  /**
   * Get communication metrics from CommunicationAnalytics table
   */
  async getCommunicationMetrics(filters: AnalyticsQueryFilters) {
    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters.userId) where.userId = filters.userId;
    if (filters.salonId) where.salonId = filters.salonId;

    try {
      // SMS metrics from CommunicationAnalytics table
      const smsMetrics = await this.prisma.communicationAnalytics.groupBy({
        by: ['communicationStatus'],
        where: {
          ...where,
          communicationType: 'SMS'
        },
        _count: true
      });

      // Email metrics from CommunicationAnalytics table
      const emailMetrics = await this.prisma.communicationAnalytics.groupBy({
        by: ['communicationStatus'],
        where: {
          ...where,
          communicationType: 'EMAIL'
        },
        _count: true
      });

      // WhatsApp metrics from CommunicationAnalytics table
      const whatsappMetrics = await this.prisma.communicationAnalytics.groupBy({
        by: ['communicationStatus'],
        where: {
          ...where,
          communicationType: 'WHATSAPP'
        },
        _count: true
      });

      // Message template usage from CommunicationAnalytics table
      const templateUsage = await this.prisma.communicationAnalytics.groupBy({
        by: ['messageTemplate'],
        where: where,
        _count: true,
        orderBy: {
          _count: {
            messageTemplate: 'desc'
          }
        },
        take: 10
      });

      return {
        sms: {
          total: smsMetrics.reduce((sum, item) => sum + item._count, 0),
          sent: smsMetrics.find(item => item.communicationStatus === 'SENT')?._count || 0,
          delivered: smsMetrics.find(item => item.communicationStatus === 'DELIVERED')?._count || 0,
          failed: smsMetrics.find(item => item.communicationStatus === 'FAILED')?._count || 0
        },
        email: {
          total: emailMetrics.reduce((sum, item) => sum + item._count, 0),
          sent: emailMetrics.find(item => item.communicationStatus === 'SENT')?._count || 0,
          delivered: emailMetrics.find(item => item.communicationStatus === 'DELIVERED')?._count || 0,
          opened: emailMetrics.find(item => item.communicationStatus === 'OPENED')?._count || 0,
          clicked: emailMetrics.find(item => item.communicationStatus === 'CLICKED')?._count || 0,
          failed: emailMetrics.find(item => item.communicationStatus === 'FAILED')?._count || 0
        },
        whatsapp: {
          total: whatsappMetrics.reduce((sum, item) => sum + item._count, 0),
          sent: whatsappMetrics.find(item => item.communicationStatus === 'SENT')?._count || 0,
          delivered: whatsappMetrics.find(item => item.communicationStatus === 'DELIVERED')?._count || 0,
          failed: whatsappMetrics.find(item => item.communicationStatus === 'FAILED')?._count || 0
        },
        topTemplates: templateUsage.map(item => ({
          template: item.messageTemplate || 'Unknown',
          count: item._count
        }))
      };
    } catch (error) {
      console.error('Error fetching communication metrics:', error);
      // Return empty metrics if there's an error
      return {
        sms: {
          total: 0,
          sent: 0,
          delivered: 0,
          failed: 0
        },
        email: {
          total: 0,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          failed: 0
        },
        whatsapp: {
          total: 0,
          sent: 0,
          delivered: 0,
          failed: 0
        },
        topTemplates: []
      };
    }
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData(filters: AnalyticsQueryFilters): Promise<AnalyticsDashboardData> {
    const [overview, businessMetrics, realTime, communications] = await Promise.all([
      this.getAggregatedData(filters),
      this.getBusinessMetrics(filters),
      this.getRealTimeMetrics(),
      this.getCommunicationMetrics(filters)
    ]);

    return {
      overview,
      businessMetrics,
      realTime,
      communications,
      timeRange: {
        startDate: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: filters.endDate || new Date()
      }
    };
  }

  /**
   * Clean up old analytics data (for data retention)
   */
  async cleanupOldData(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.analyticsEvent.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    return result.count;
  }
}
