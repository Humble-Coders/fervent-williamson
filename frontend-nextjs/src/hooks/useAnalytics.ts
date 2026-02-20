import { useCallback, useEffect, useRef } from 'react';
import { logger } from '@/config/logger';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { buildApiUrl } from '../config/env';
import { analyticsConfigApi } from '../services/analyticsConfigApi';
import type { AnalyticsConfigData } from '../services/analyticsConfigApi';

// Analytics event types
export type AnalyticsEventType = 'PAGE_VIEW' | 'ACTION' | 'CONVERSION' | 'ERROR';
export type DeviceType = 'MOBILE' | 'DESKTOP' | 'TABLET';

// Analytics event interface
export interface AnalyticsEvent {
  sessionId: string;
  eventType: AnalyticsEventType;
  page: string;
  action?: string;
  
  // Business context
  salonId?: string;
  salonDisplayId?: number;
  serviceId?: string;
  serviceDisplayId?: number;
  stylistId?: string;
  stylistDisplayId?: number;
  bookingId?: string;
  bookingDisplayId?: number;
  
  // User context
  deviceType?: DeviceType;
  userAgent?: string;
  referrer?: string;
  
  // Additional metadata
  metadata?: Record<string, unknown>;
  duration?: number;
  errorCode?: string;
  errorMessage?: string;
}

// Session management
class SessionManager {
  private static instance: SessionManager;
  private sessionId: string;
  private pageStartTime: number;

  private constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.pageStartTime = Date.now();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private getOrCreateSessionId(): string {
    // Only access sessionStorage on the client side
    if (typeof window === 'undefined') {
      return this.generateSessionId();
    }

    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getPageDuration(): number {
    return Math.floor((Date.now() - this.pageStartTime) / 1000);
  }

  public resetPageTimer(): void {
    this.pageStartTime = Date.now();
  }
}

// Device detection
function detectDeviceType(): DeviceType {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('mobile') || 
      userAgent.includes('android') || 
      userAgent.includes('iphone') || 
      userAgent.includes('ipod')) {
    return 'MOBILE';
  }
  
  if (userAgent.includes('tablet') || 
      userAgent.includes('ipad')) {
    return 'TABLET';
  }
  
  return 'DESKTOP';
}

// Analytics service
class AnalyticsService {
  private queue: AnalyticsEvent[] = [];
  private isOnline = navigator.onLine;
  private flushInterval: NodeJS.Timeout | null = null;
  private config: AnalyticsConfigData | null = null;
  private configLoadPromise: Promise<void> | null = null;

  constructor() {
    this.setupEventListeners();
    this.startFlushInterval();
    this.loadConfig();
  }

  private setupEventListeners(): void {
    // Only set up event listeners on the client side
    if (typeof window === 'undefined') return;

    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flush();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });
  }

  private startFlushInterval(): void {
    // Flush events every 10 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 10000);
  }

  private async loadConfig(): Promise<void> {
    if (this.configLoadPromise) {
      return this.configLoadPromise;
    }

    this.configLoadPromise = (async () => {
      try {
        // Only access localStorage on the client side
        if (typeof window === 'undefined') {
          // logger.info('📊 SSR: Analytics disabled on server side');
          return;
        }

        // Load config based on authentication status
        const token = localStorage.getItem('auth_token');
        if (!token) {
          logger.info('📊 No auth token found, loading public analytics config');
          // Load public config for unauthenticated users
          try {
            const response = await fetch(buildApiUrl('analytics-config/public'));
            if (response.ok) {
              const result = await response.json();
              this.config = {
                ...result.data,
                pageViewRetentionDays: 30,
                communicationRetentionDays: 30,
                businessRetentionDays: 30,
                enableAutoCleanup: false,
                cleanupFrequencyDays: 7
              };
            } else {
              throw new Error('Failed to load public config');
            }
          } catch (error) {
            // logger.warn('📊 Failed to load public analytics config, defaulting to disabled:', error);
            // Default to all tracking disabled when public config fails
            this.config = {
              // Custom Analytics System (CutQ Internal)
              trackPageViews: false,
              trackUserActions: false,
              trackConversions: false,
              trackErrors: false,
              trackSmsMessages: false,
              trackEmailMessages: false,
              trackWhatsappMessages: false,
              trackBookingFunnel: false,
              trackSalonViews: false,
              trackServiceViews: false,
              trackStylistViews: false,
              trackActiveSessions: false,
              trackRealTimeActions: false,

              // Google Analytics (External)
              enableGoogleAnalytics: false,
              googleAnalyticsPageViews: false,
              googleAnalyticsEvents: false,
              googleAnalyticsConversions: false,
              googleAnalyticsErrors: false,
              googleAnalyticsWebVitals: false,

              // Data Retention and Cleanup
              pageViewRetentionDays: 30,
              communicationRetentionDays: 30,
              businessRetentionDays: 30,
              enableAutoCleanup: false,
              cleanupFrequencyDays: 7
            };
          }
          return;
        }

        this.config = await analyticsConfigApi.getConfig();
        // logger.info('📊 Analytics configuration loaded:', this.config);
      } catch (error) {
        logger.warn('📊 Failed to load analytics configuration, defaulting to disabled:', error);
        // Default to all tracking disabled if config fails to load
        this.config = {
          // Custom Analytics System (CutQ Internal)
          trackPageViews: false,
          trackUserActions: false,
          trackConversions: false,
          trackErrors: false,
          trackSmsMessages: false,
          trackEmailMessages: false,
          trackWhatsappMessages: false,
          trackBookingFunnel: false,
          trackSalonViews: false,
          trackServiceViews: false,
          trackStylistViews: false,
          trackActiveSessions: false,
          trackRealTimeActions: false,

          // Google Analytics (External)
          enableGoogleAnalytics: false,
          googleAnalyticsPageViews: false,
          googleAnalyticsEvents: false,
          googleAnalyticsConversions: false,
          googleAnalyticsErrors: false,
          googleAnalyticsWebVitals: false,

          // Data Retention and Cleanup
          pageViewRetentionDays: 30,
          communicationRetentionDays: 30,
          businessRetentionDays: 30,
          enableAutoCleanup: false,
          cleanupFrequencyDays: 7
        };
      }
    })();

    return this.configLoadPromise;
  }

  /**
   * Check if analytics is completely disabled (all tracking options are false)
   */
  private isAnalyticsCompletelyDisabled(): boolean {
    if (!this.config) {
      return true; // No config means disabled
    }

    return !this.config.trackPageViews &&
           !this.config.trackUserActions &&
           !this.config.trackConversions &&
           !this.config.trackErrors &&
           !this.config.trackSmsMessages &&
           !this.config.trackEmailMessages &&
           !this.config.trackWhatsappMessages &&
           !this.config.trackBookingFunnel &&
           !this.config.trackSalonViews &&
           !this.config.trackServiceViews &&
           !this.config.trackStylistViews &&
           !this.config.trackActiveSessions &&
           !this.config.trackRealTimeActions;
  }

  /**
   * Public method to check if analytics is enabled
   */
  public async isAnalyticsEnabled(): Promise<boolean> {
    await this.loadConfig();
    return !this.isAnalyticsCompletelyDisabled();
  }

  /**
   * Refresh analytics configuration (useful when user logs in/out)
   */
  public async refreshConfig(): Promise<void> {
    this.configLoadPromise = null;
    this.config = null;
    await this.loadConfig();
  }

  private async isTrackingEnabled(eventType: AnalyticsEventType, action?: string): Promise<boolean> {
    // Wait for config to load
    await this.loadConfig();

    // If no config loaded, default to disabled
    if (!this.config) {
      return false;
    }

    // Check if ALL tracking is disabled (master disable check)
    if (this.isAnalyticsCompletelyDisabled()) {
      // logger.info('📊 All analytics tracking is disabled, skipping event');
      return false;
    }

    // Map event types to configuration settings
    switch (eventType) {
      case 'PAGE_VIEW':
        return this.config.trackPageViews;

      case 'ACTION':
        // Check specific action types
        if (action === 'salon_view' || action === 'salon_viewed') {
          return this.config.trackSalonViews;
        }
        if (action === 'service_view' || action === 'service_viewed') {
          return this.config.trackServiceViews;
        }
        if (action === 'stylist_view' || action === 'stylist_viewed') {
          return this.config.trackStylistViews;
        }
        if (action?.includes('booking_')) {
          return this.config.trackBookingFunnel;
        }
        // Default to user actions tracking for other actions
        return this.config.trackUserActions;

      case 'CONVERSION':
        return this.config.trackConversions;

      case 'ERROR':
        return this.config.trackErrors;

      default:
        // For unknown event types, default to user actions tracking
        return this.config.trackUserActions;
    }
  }

  public async track(event: Partial<AnalyticsEvent>): Promise<void> {
    const eventType = event.eventType || 'ACTION';

    // Check if tracking is enabled for this event type
    const trackingEnabled = await this.isTrackingEnabled(eventType, event.action);
    if (!trackingEnabled) {
      // logger.info(`📊 Tracking disabled for event type: ${eventType}${event.action ? ` (${event.action})` : ''}, skipping event`);
      return;
    }

    const sessionManager = SessionManager.getInstance();

    const fullEvent: AnalyticsEvent = {
      sessionId: sessionManager.getSessionId(),
      eventType: eventType,
      page: event.page || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      action: event.action,
      salonId: event.salonId,
      salonDisplayId: event.salonDisplayId,
      serviceId: event.serviceId,
      serviceDisplayId: event.serviceDisplayId,
      stylistId: event.stylistId,
      stylistDisplayId: event.stylistDisplayId,
      bookingId: event.bookingId,
      bookingDisplayId: event.bookingDisplayId,
      deviceType: detectDeviceType(),
      userAgent: navigator.userAgent,
      referrer: document.referrer || undefined,
      metadata: {
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        title: document.title,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        ...event.metadata
      },
      duration: event.duration,
      errorCode: event.errorCode,
      errorMessage: event.errorMessage
    };

    this.queue.push(fullEvent);

    // Flush immediately for errors and conversions
    if (event.eventType === 'ERROR' || event.eventType === 'CONVERSION') {
      this.flush();
    }
  }

  private async flush(sync = false): Promise<void> {
    if (this.queue.length === 0 || (!this.isOnline && !sync)) {
      return;
    }

    // Ensure configuration is loaded before making any decisions
    await this.loadConfig();

    // Check if analytics is completely disabled before making API calls
    if (this.isAnalyticsCompletelyDisabled()) {
      // logger.info('📊 Analytics completely disabled, clearing queue without sending');
      this.queue = []; // Clear the queue without sending
      return;
    }

    const events = [...this.queue];
    this.queue = [];

    try {
      const response = await fetch(buildApiUrl('analytics/track'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({ events }),
        keepalive: sync // Use keepalive for sync requests
      });

      if (!response.ok) {
        // Re-queue events if request failed
        this.queue.unshift(...events);
      }
    } catch (error) {
      logger.warn('Analytics tracking failed:', error);
      // Re-queue events if request failed
      this.queue.unshift(...events);
    }
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush(true);
  }
}

// Global analytics instance
const analyticsService = new AnalyticsService();

// Safe location hook for Next.js
function useSafeLocation() {
  const pathname = usePathname();

  return {
    pathname,
    search: typeof window !== 'undefined' ? window.location.search : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
    state: null,
    key: 'default'
  };
}

// Main analytics hook
export function useAnalytics() {
  const location = useSafeLocation();
  const { user } = useAuthStore();
  const sessionManager = SessionManager.getInstance();
  const lastLocationRef = useRef(location.pathname);

  // Track page views automatically
  useEffect(() => {
    if (location.pathname !== lastLocationRef.current) {
      sessionManager.resetPageTimer();

      // Track page view in custom analytics (async, fire-and-forget)
      analyticsService.track({
        eventType: 'PAGE_VIEW',
        page: location.pathname,
        metadata: {
          search: location.search,
          hash: location.hash,
          state: location.state
        }
      }).catch(error => {
        logger.warn('📊 Failed to track page view:', error);
      });

      // Track page view in Google Analytics (always enabled)
      // import('../services/googleAnalytics').then(({ default: googleAnalyticsService }) => {
      //   googleAnalyticsService.trackPageView(location.pathname, document.title);
      // }).catch(error => {
      //   logger.warn('📊 Failed to track Google Analytics page view:', error);
      // });

      lastLocationRef.current = location.pathname;
    }
  }, [location, sessionManager]);

  // Track user actions
  const trackAction = useCallback((action: string, metadata?: Record<string, unknown>) => {
    analyticsService.track({
      eventType: 'ACTION',
      action,
      metadata
    }).catch(error => {
      logger.warn('📊 Failed to track action:', error);
    });
  }, []);

  // Track conversions
  const trackConversion = useCallback((conversionType: string, metadata?: Record<string, unknown>) => {
    analyticsService.track({
      eventType: 'CONVERSION',
      action: conversionType,
      metadata
    }).catch(error => {
      logger.warn('📊 Failed to track conversion:', error);
    });
  }, []);

  // Track errors
  const trackError = useCallback((error: Error | string, errorCode?: string) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'object' ? error.stack : undefined;

    analyticsService.track({
      eventType: 'ERROR',
      action: 'error_occurred',
      errorCode: errorCode || 'UNKNOWN',
      errorMessage,
      metadata: {
        stack: stack?.substring(0, 1000), // Limit stack trace
        userAgent: navigator.userAgent,
        url: typeof window !== 'undefined' ? window.location.href : ''
      }
    }).catch(trackingError => {
      logger.warn('📊 Failed to track error:', trackingError);
    });
  }, []);

  // Track business events with context
  const trackBusinessEvent = useCallback((
    eventType: AnalyticsEventType,
    action: string,
    context: {
      salonId?: string;
      salonDisplayId?: number;
      serviceId?: string;
      serviceDisplayId?: number;
      stylistId?: string;
      stylistDisplayId?: number;
      bookingId?: string;
      bookingDisplayId?: number;
    },
    metadata?: Record<string, unknown>
  ) => {
    analyticsService.track({
      eventType,
      action,
      ...context,
      metadata
    }).catch(error => {
      logger.warn('📊 Failed to track business event:', error);
    });
  }, []);

  // Track page duration when component unmounts
  const trackPageDuration = useCallback(() => {
    const duration = sessionManager.getPageDuration();
    if (duration > 0) {
      analyticsService.track({
        eventType: 'ACTION',
        action: 'page_duration',
        duration,
        metadata: {
          page: location.pathname
        }
      }).catch(error => {
        logger.warn('📊 Failed to track page duration:', error);
      });
    }
  }, [location.pathname, sessionManager]);

  return {
    trackAction,
    trackConversion,
    trackError,
    trackBusinessEvent,
    trackPageDuration,
    sessionId: sessionManager.getSessionId(),
    user
  };
}
