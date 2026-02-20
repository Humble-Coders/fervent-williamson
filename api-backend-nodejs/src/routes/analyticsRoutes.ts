import { Router, Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { asyncAnalytics } from '../services/asyncAnalyticsService';
import { analyticsConfigService } from '../services/analyticsConfigService';
import { AnalyticsQueryFilters } from '../types/analytics';
import { authenticateToken } from '../middleware/simpleAuth';
import { requireAdmin } from '../middleware/simpleAuth';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';

export function createAnalyticsRoutes(analyticsService: AnalyticsService): Router {
  const router = Router();

  /**
   * GET /api/analytics/events
   * Get analytics events with filters (Admin only)
   */
  router.get('/events',
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const filters: AnalyticsQueryFilters = {
          userId: req.query.userId as string,
          sessionId: req.query.sessionId as string,
          eventType: req.query.eventType as any,
          page: req.query.page as string,
          action: req.query.action as string,
          salonId: req.query.salonId as string,
          serviceId: req.query.serviceId as string,
          stylistId: req.query.stylistId as string,
          bookingId: req.query.bookingId as string,
          userRole: req.query.userRole as any,
          deviceType: req.query.deviceType as any,
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
          offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        };

        const events = await analyticsService.getEvents(filters);
        res.json({
          success: true,
          data: events
        });
      } catch (error) {
        console.error('Error fetching analytics events:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch analytics events'
        });
      }
    }
  );

  /**
   * GET /api/analytics/overview
   * Get aggregated analytics overview (Admin only)
   */
  router.get('/overview',
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const filters: AnalyticsQueryFilters = {
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };

        const overview = await analyticsService.getAggregatedData(filters);
        res.json({
          success: true,
          data: overview
        });
      } catch (error) {
        console.error('Error fetching analytics overview:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch analytics overview'
        });
      }
    }
  );

  /**
   * GET /api/analytics/business-metrics
   * Get business intelligence metrics (Admin only)
   */
  router.get('/business-metrics',
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const filters: AnalyticsQueryFilters = {
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };

        const businessMetrics = await analyticsService.getBusinessMetrics(filters);
        res.json({
          success: true,
          data: businessMetrics
        });
      } catch (error) {
        console.error('Error fetching business metrics:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch business metrics'
        });
      }
    }
  );

  /**
   * GET /api/analytics/communications
   * Get communication analytics (SMS, Email, WhatsApp) (Admin only)
   */
  router.get('/communications',
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const filters: AnalyticsQueryFilters = {
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
          salonId: req.query.salonId as string,
          userId: req.query.userId as string,
        };

        const communications = await analyticsService.getCommunicationMetrics(filters);
        res.json({
          success: true,
          data: communications
        });
      } catch (error) {
        console.error('Error fetching communication metrics:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch communication metrics'
        });
      }
    }
  );

  /**
   * GET /api/analytics/real-time
   * Get real-time analytics metrics (Admin only)
   */
  router.get('/real-time',
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const realTimeMetrics = await analyticsService.getRealTimeMetrics();
        res.json({
          success: true,
          data: realTimeMetrics
        });
      } catch (error) {
        console.error('Error fetching real-time metrics:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch real-time metrics'
        });
      }
    }
  );

  /**
   * GET /api/analytics/dashboard
   * Get complete dashboard data (Admin only)
   */
  router.get('/dashboard',
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const filters: AnalyticsQueryFilters = {
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };

        const dashboardData = await analyticsService.getDashboardData(filters);
        res.json({
          success: true,
          data: dashboardData
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch dashboard data'
        });
      }
    }
  );

  /**
   * GET /api/analytics/session/:sessionId
   * Get analytics for a specific session (Admin only)
   */
  router.get('/session/:sessionId',
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const sessionAnalytics = await analyticsService.getSessionAnalytics(sessionId);
        
        if (!sessionAnalytics) {
          return res.status(404).json({
            success: false,
            message: 'Session not found'
          });
        }

        res.json({
          success: true,
          data: sessionAnalytics
        });
      } catch (error) {
        console.error('Error fetching session analytics:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch session analytics'
        });
      }
    }
  );

  /**
   * GET /api/analytics/salon/:salonId
   * Get analytics for a specific salon (Salon Owner can access their own salon)
   */
  router.get('/salon/:salonId', 
    authenticateToken, 
    async (req: Request, res: Response) => {
      try {
        const { salonId } = req.params;
        const user = req.user;

        // Check permissions
        if ((user as any)?.role === UserRole.SALON_OWNER) {
          // Verify salon ownership
          const salon = await prisma.salon.findFirst({
            where: { id: salonId, ownerId: (user as any).id }
          });

          if (!salon) {
            return res.status(403).json({
              success: false,
              message: 'Access denied'
            });
          }
        } else if ((user as any)?.role !== UserRole.ADMIN) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }

        const filters: AnalyticsQueryFilters = {
          salonId,
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };

        const [overview, businessMetrics] = await Promise.all([
          analyticsService.getAggregatedData(filters),
          analyticsService.getBusinessMetrics(filters)
        ]);

        res.json({
          success: true,
          data: {
            overview,
            businessMetrics: {
              popularServices: businessMetrics.popularServices,
              popularStylists: businessMetrics.popularStylists,
              userEngagement: businessMetrics.userEngagement,
              peakHours: businessMetrics.peakHours,
              peakDays: businessMetrics.peakDays
            }
          }
        });
      } catch (error) {
        console.error('Error fetching salon analytics:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch salon analytics'
        });
      }
    }
  );

  /**
   * POST /api/analytics/track
   * Manual event tracking endpoint (for frontend) - Non-blocking
   */
  router.post('/track', async (req: Request, res: Response) => {
    try {
      const { events } = req.body;

      // Handle both single event and array of events
      const eventsArray = Array.isArray(events) ? events : [events || req.body];

      // Early check: if all analytics tracking is disabled, skip processing entirely
      const allTrackingDisabled = await analyticsConfigService.isAllTrackingDisabled();
      if (allTrackingDisabled) {
        console.log('📊 All analytics tracking is disabled, skipping all events');
        res.json({
          success: true,
          message: 'Analytics tracking is disabled'
        });
        return;
      }

      // Process each event
      for (const eventData of eventsArray) {
        // Check if tracking is enabled for this event type
        const trackingEnabled = await isEventTrackingEnabled(eventData);
        if (!trackingEnabled) {
          console.log(`📊 Tracking disabled for event type: ${eventData.eventType || 'unknown'}, skipping event`);
          continue; // Skip this event
        }

        // Add user context if authenticated
        if (req.user) {
          eventData.userId = (req.user as any).id;
          eventData.userRole = (req.user as any).role;
        }

        // Add request context
        eventData.page = eventData.page || req.headers.referer || '/unknown';
        eventData.userAgent = eventData.userAgent || req.headers['user-agent'];
        eventData.ipAddress = eventData.ipAddress || req.ip;

        // Use async analytics service (non-blocking)
        asyncAnalytics.trackEvent(eventData);
      }

      // Return immediately - don't wait for analytics processing
      res.json({
        success: true,
        message: 'Event queued for tracking'
      });
    } catch (error) {
      console.error('Error queuing analytics event:', error);
      // Even if queuing fails, return success to not block frontend
      res.json({
        success: true,
        message: 'Event received (analytics may be delayed)'
      });
    }
  });

  /**
   * GET /api/analytics/queue-stats
   * Get analytics queue statistics (Admin only)
   */
  router.get('/queue-stats',
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const stats = await asyncAnalytics.getQueueStats();
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        console.error('Error fetching queue stats:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch queue statistics'
        });
      }
    }
  );

  /**
   * DELETE /api/analytics/cleanup
   * Clean up old analytics data (Admin only)
   */
  router.delete('/cleanup',
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const daysToKeep = req.query.days ? parseInt(req.query.days as string) : 90;
        const deletedCount = await analyticsService.cleanupOldData(daysToKeep);
        
        res.json({
          success: true,
          message: `Cleaned up ${deletedCount} old analytics records`,
          data: { deletedCount, daysToKeep }
        });
      } catch (error) {
        console.error('Error cleaning up analytics data:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to cleanup analytics data'
        });
      }
    }
  );

  /**
   * Helper function to check if tracking is enabled for a specific event type
   */
  async function isEventTrackingEnabled(eventData: any): Promise<boolean> {
    try {
      const eventType = eventData.eventType;
      const action = eventData.action;

      // Map event types and actions to configuration settings
      switch (eventType) {
        case 'PAGE_VIEW':
          return await analyticsConfigService.isTrackingEnabled('trackPageViews');

        case 'ACTION':
          // Check specific action types
          if (action === 'booking_created' || action === 'booking_confirmed' || action === 'booking_cancelled') {
            return await analyticsConfigService.isTrackingEnabled('trackBookingFunnel');
          }
          if (action === 'salon_view') {
            return await analyticsConfigService.isTrackingEnabled('trackSalonViews');
          }
          if (action === 'service_view') {
            return await analyticsConfigService.isTrackingEnabled('trackServiceViews');
          }
          if (action === 'stylist_view') {
            return await analyticsConfigService.isTrackingEnabled('trackStylistViews');
          }
          // Default to user actions tracking for other actions
          return await analyticsConfigService.isTrackingEnabled('trackUserActions');

        case 'CONVERSION':
          return await analyticsConfigService.isTrackingEnabled('trackConversions');

        case 'ERROR':
          return await analyticsConfigService.isTrackingEnabled('trackErrors');

        case 'COMMUNICATION':
          // Check communication type
          const communicationType = eventData.communicationType || eventData.metadata?.type;
          if (communicationType === 'SMS' || communicationType === 'sms') {
            return await analyticsConfigService.isTrackingEnabled('trackSmsMessages');
          }
          if (communicationType === 'EMAIL' || communicationType === 'email') {
            return await analyticsConfigService.isTrackingEnabled('trackEmailMessages');
          }
          if (communicationType === 'WHATSAPP' || communicationType === 'whatsapp') {
            return await analyticsConfigService.isTrackingEnabled('trackWhatsappMessages');
          }
          // Default to SMS tracking if type not specified
          return await analyticsConfigService.isTrackingEnabled('trackSmsMessages');

        case 'SESSION':
          return await analyticsConfigService.isTrackingEnabled('trackActiveSessions');

        case 'REAL_TIME':
          return await analyticsConfigService.isTrackingEnabled('trackRealTimeActions');

        default:
          // For unknown event types, check general user actions tracking
          console.log(`⚠️  Unknown event type: ${eventType}, defaulting to user actions tracking`);
          return await analyticsConfigService.isTrackingEnabled('trackUserActions');
      }
    } catch (error) {
      console.error('Error checking event tracking configuration:', error);
      // Default to disabled if we can't check the configuration
      return false;
    }
  }

  return router;
}
