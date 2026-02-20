import { Request, Response, NextFunction } from 'express';
import { AnalyticsEventType } from '@prisma/client';
import { AnalyticsService } from '../services/analyticsService';
import { analyticsConfigService } from '../services/analyticsConfigService';
import { CreateAnalyticsEventData } from '../types/analytics';
import {
  detectDeviceType,
  getClientIP,
  getSessionId,
  getPageRoute,
  extractBusinessContext,
  sanitizeUserAgent,
  getReferrer,
  isBot,
  createAnalyticsMetadata,
  validateAnalyticsEvent,
  isRateLimited
} from '../utils/analyticsUtils';

// Extend Express Request interface to include analytics data
declare global {
  namespace Express {
    interface Request {
      analytics?: {
        sessionId: string;
        deviceType: string;
        ipAddress: string;
        userAgent: string;
        referrer?: string;
        businessContext: any;
      };
    }
  }
}

export class AnalyticsMiddleware {
  private analyticsService: AnalyticsService;
  private enabledRoutes: string[];
  private excludedRoutes: string[];
  private enabledMethods: string[];

  constructor(
    analyticsService: AnalyticsService,
    options: {
      enabledRoutes?: string[];
      excludedRoutes?: string[];
      enabledMethods?: string[];
    } = {}
  ) {
    this.analyticsService = analyticsService;
    this.enabledRoutes = options.enabledRoutes || ['*']; // Track all routes by default
    this.excludedRoutes = options.excludedRoutes || [
      '/health',
      '/metrics',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
      '/api/analytics' // Don't track analytics API calls
    ];
    this.enabledMethods = options.enabledMethods || ['GET', 'POST', 'PUT', 'DELETE'];
  }

  /**
   * Main analytics middleware function
   */
  public trackPageView = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Skip if route is excluded or method not enabled
        if (!this.shouldTrack(req)) {
          return next();
        }

        // Skip bot traffic
        const userAgent = req.headers['user-agent'] || '';
        if (isBot(userAgent)) {
          return next();
        }

        // Extract analytics data from request
        const analyticsData = this.extractAnalyticsData(req);
        
        // Add analytics data to request for use in other middleware/routes
        req.analytics = analyticsData;

        // Record page view event for GET requests
        if (req.method === 'GET') {
          await this.recordPageViewEvent(req, analyticsData);
        }

        next();
      } catch (error) {
        console.error('Analytics middleware error:', error);
        // Don't break the request flow
        next();
      }
    };
  };

  /**
   * Middleware to track API actions
   */
  public trackAction = (actionName: string, metadata?: Record<string, any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const analyticsData = req.analytics || this.extractAnalyticsData(req);
        
        // Check rate limiting
        if (isRateLimited(analyticsData.sessionId)) {
          return next();
        }

        await this.recordActionEvent(req, analyticsData, actionName, metadata);
        next();
      } catch (error) {
        console.error('Analytics action tracking error:', error);
        next();
      }
    };
  };

  /**
   * Middleware to track conversions
   */
  public trackConversion = (conversionType: string, metadata?: Record<string, any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const analyticsData = req.analytics || this.extractAnalyticsData(req);
        
        await this.recordConversionEvent(req, analyticsData, conversionType, metadata);
        next();
      } catch (error) {
        console.error('Analytics conversion tracking error:', error);
        next();
      }
    };
  };

  /**
   * Middleware to track errors
   */
  public trackError = () => {
    return (error: any, req: Request, res: Response, next: NextFunction) => {
      try {
        const analyticsData = req.analytics || this.extractAnalyticsData(req);
        
        // Record error event asynchronously
        this.recordErrorEvent(req, analyticsData, error).catch(err => {
          console.error('Failed to record error event:', err);
        });
      } catch (err) {
        console.error('Analytics error tracking error:', err);
      }
      
      next(error);
    };
  };

  /**
   * Extract analytics data from request
   */
  private extractAnalyticsData(req: Request) {
    const sessionId = getSessionId(req);
    const userAgent = sanitizeUserAgent(req.headers['user-agent'] || '');
    const deviceType = detectDeviceType(userAgent);
    const ipAddress = getClientIP(req);
    const referrer = getReferrer(req);
    const businessContext = extractBusinessContext(req);

    return {
      sessionId,
      deviceType,
      ipAddress,
      userAgent,
      referrer,
      businessContext
    };
  }

  /**
   * Record page view event
   */
  private async recordPageViewEvent(req: Request, analyticsData: any) {
    // Check if page view tracking is enabled
    const isEnabled = await analyticsConfigService.isTrackingEnabled('trackPageViews');
    if (!isEnabled) {
      console.log('📊 Page view tracking disabled, skipping event');
      return;
    }

    const page = getPageRoute(req);

    // Check rate limiting
    if (isRateLimited(analyticsData.sessionId)) {
      return;
    }

    const eventData: CreateAnalyticsEventData = {
      userId: (req.user as any)?.id,
      sessionId: analyticsData.sessionId,
      eventType: AnalyticsEventType.PAGE_VIEW,
      page,
      userRole: (req.user as any)?.role,
      deviceType: analyticsData.deviceType,
      userAgent: analyticsData.userAgent,
      ipAddress: analyticsData.ipAddress,
      referrer: analyticsData.referrer,
      ...analyticsData.businessContext,
      metadata: createAnalyticsMetadata(req, {
        pageTitle: req.headers['x-page-title'],
        viewport: req.headers['x-viewport']
      })
    };

    if (validateAnalyticsEvent(eventData)) {
      await this.analyticsService.recordEvent(eventData);
    }
  }

  /**
   * Record action event
   */
  private async recordActionEvent(
    req: Request,
    analyticsData: any,
    actionName: string,
    metadata?: Record<string, any>
  ) {
    // Check if user action tracking is enabled
    const isEnabled = await analyticsConfigService.isTrackingEnabled('trackUserActions');
    if (!isEnabled) {
      console.log('📊 User action tracking disabled, skipping event');
      return;
    }

    const page = getPageRoute(req);

    const eventData: CreateAnalyticsEventData = {
      userId: (req.user as any)?.id,
      sessionId: analyticsData.sessionId,
      eventType: AnalyticsEventType.ACTION,
      page,
      action: actionName,
      userRole: (req.user as any)?.role,
      deviceType: analyticsData.deviceType,
      userAgent: analyticsData.userAgent,
      ipAddress: analyticsData.ipAddress,
      referrer: analyticsData.referrer,
      ...analyticsData.businessContext,
      metadata: createAnalyticsMetadata(req, metadata)
    };

    if (validateAnalyticsEvent(eventData)) {
      await this.analyticsService.recordEvent(eventData);
    }
  }

  /**
   * Record conversion event
   */
  private async recordConversionEvent(
    req: Request,
    analyticsData: any,
    conversionType: string,
    metadata?: Record<string, any>
  ) {
    // Check if conversion tracking is enabled
    const isEnabled = await analyticsConfigService.isTrackingEnabled('trackConversions');
    if (!isEnabled) {
      console.log('📊 Conversion tracking disabled, skipping event');
      return;
    }

    const page = getPageRoute(req);

    const eventData: CreateAnalyticsEventData = {
      userId: (req.user as any)?.id,
      sessionId: analyticsData.sessionId,
      eventType: AnalyticsEventType.CONVERSION,
      page,
      action: conversionType,
      userRole: (req.user as any)?.role,
      deviceType: analyticsData.deviceType,
      userAgent: analyticsData.userAgent,
      ipAddress: analyticsData.ipAddress,
      referrer: analyticsData.referrer,
      ...analyticsData.businessContext,
      metadata: createAnalyticsMetadata(req, metadata)
    };

    if (validateAnalyticsEvent(eventData)) {
      await this.analyticsService.recordEvent(eventData);
    }
  }

  /**
   * Record error event
   */
  private async recordErrorEvent(req: Request, analyticsData: any, error: any) {
    // Check if error tracking is enabled
    const isEnabled = await analyticsConfigService.isTrackingEnabled('trackErrors');
    if (!isEnabled) {
      console.log('📊 Error tracking disabled, skipping event');
      return;
    }

    const page = getPageRoute(req);

    const eventData: CreateAnalyticsEventData = {
      userId: (req.user as any)?.id,
      sessionId: analyticsData.sessionId,
      eventType: AnalyticsEventType.ERROR,
      page,
      action: 'error_occurred',
      userRole: (req.user as any)?.role,
      deviceType: analyticsData.deviceType,
      userAgent: analyticsData.userAgent,
      ipAddress: analyticsData.ipAddress,
      referrer: analyticsData.referrer,
      ...analyticsData.businessContext,
      errorCode: error.code || error.status || 'UNKNOWN',
      errorMessage: error.message || 'Unknown error',
      metadata: createAnalyticsMetadata(req, {
        stack: error.stack?.substring(0, 1000), // Limit stack trace length
        statusCode: error.status || error.statusCode
      })
    };

    if (validateAnalyticsEvent(eventData)) {
      await this.analyticsService.recordEvent(eventData);
    }
  }

  /**
   * Check if request should be tracked
   */
  private shouldTrack(req: Request): boolean {
    const path = req.path || req.url || '/';
    const method = req.method;

    // Check if method is enabled
    if (!this.enabledMethods.includes(method)) {
      return false;
    }

    // Check excluded routes
    for (const excludedRoute of this.excludedRoutes) {
      if (path.startsWith(excludedRoute)) {
        return false;
      }
    }

    // Check enabled routes
    if (this.enabledRoutes.includes('*')) {
      return true;
    }

    for (const enabledRoute of this.enabledRoutes) {
      if (path.startsWith(enabledRoute)) {
        return true;
      }
    }

    return false;
  }
}

/**
 * Helper function to create analytics middleware instance
 */
export function createAnalyticsMiddleware(
  analyticsService: AnalyticsService,
  options?: {
    enabledRoutes?: string[];
    excludedRoutes?: string[];
    enabledMethods?: string[];
  }
) {
  return new AnalyticsMiddleware(analyticsService, options);
}
