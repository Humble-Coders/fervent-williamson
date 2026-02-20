import { PrismaClient } from '@prisma/client';

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get dashboard analytics data
   */
  async getDashboardData(startDate?: Date, endDate?: Date) {
    try {
      const where: any = {};
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // Get basic analytics event counts
      const totalEvents = await this.prisma.analyticsEvent.count({ where });
      const pageViews = await this.prisma.analyticsEvent.count({
        where: { ...where, eventType: 'PAGE_VIEW' }
      });
      const actions = await this.prisma.analyticsEvent.count({
        where: { ...where, eventType: 'ACTION' }
      });
      const conversions = await this.prisma.analyticsEvent.count({
        where: { ...where, eventType: 'CONVERSION' }
      });
      const errors = await this.prisma.analyticsEvent.count({
        where: { ...where, eventType: 'ERROR' }
      });

      // Get communication analytics
      const totalCommunications = await this.prisma.communicationAnalytics.count({ where });

      return {
        overview: {
          totalEvents,
          pageViews,
          actions,
          conversions,
          errors,
          totalCommunications
        },
        eventsByType: [
          { eventType: 'PAGE_VIEW', count: pageViews },
          { eventType: 'ACTION', count: actions },
          { eventType: 'CONVERSION', count: conversions },
          { eventType: 'ERROR', count: errors }
        ],
        communication: {
          total: totalCommunications,
          sms: { sent: 0, delivered: 0, failed: 0 },
          email: { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 },
          whatsapp: { sent: 0, delivered: 0, failed: 0 }
        },
        userEngagement: {
          uniqueUsers: 0,
          averageSessionDuration: 0,
          bounceRate: 0,
          topPages: []
        },
        businessMetrics: {
          bookingFunnel: {
            salonViews: 0,
            serviceViews: 0,
            bookingAttempts: 0,
            bookingCompletions: 0,
            conversionRate: 0
          },
          popularServices: [],
          popularStylists: []
        }
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get analytics events with basic filtering
   */
  async getEvents(filters: any = {}) {
    try {
      const where: any = {};
      
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      if (filters.eventType) {
        where.eventType = filters.eventType;
      }

      if (filters.userId) {
        where.userId = filters.userId;
      }

      return await this.prisma.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0
      });
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  }

  /**
   * Get session analytics (simplified)
   */
  async getSessionAnalytics(sessionId: string) {
    try {
      const events = await this.prisma.analyticsEvent.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' }
      });

      if (events.length === 0) return null;

      const firstEvent = events[0];
      const lastEvent = events[events.length - 1];
      const pageViews = events.filter(e => e.eventType === 'PAGE_VIEW');
      const actions = events.filter(e => e.eventType === 'ACTION');
      const conversions = events.filter(e => e.eventType === 'CONVERSION');

      const duration = lastEvent.createdAt.getTime() - firstEvent.createdAt.getTime();

      return {
        sessionId,
        userId: firstEvent.userId || undefined,
        userRole: firstEvent.userRole || undefined,
        startTime: firstEvent.createdAt,
        endTime: lastEvent.createdAt,
        duration,
        pageViews: pageViews.length,
        actions: actions.length,
        conversions: conversions.length,
        events: events.length,
        pages: [...new Set(pageViews.map(e => e.page))],
        deviceType: firstEvent.deviceType || undefined,
        userAgent: firstEvent.userAgent || undefined
      };
    } catch (error) {
      console.error('Error getting session analytics:', error);
      throw error;
    }
  }

  /**
   * Get real-time analytics (simplified)
   */
  async getRealTimeAnalytics() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const recentEvents = await this.prisma.analyticsEvent.count({
        where: {
          createdAt: {
            gte: oneHourAgo
          }
        }
      });

      return {
        activeUsers: 0, // Would need session tracking
        recentEvents,
        currentPageViews: 0,
        realTimeActions: []
      };
    } catch (error) {
      console.error('Error getting real-time analytics:', error);
      throw error;
    }
  }
}
