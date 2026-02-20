import { AnalyticsEventType, DeviceType, UserRole } from '@prisma/client';

// Analytics Event Creation Interface
export interface CreateAnalyticsEventData {
  userId?: string;
  sessionId: string;
  eventType: AnalyticsEventType;
  page: string;
  action?: string;
  
  // Business-specific tracking
  salonId?: string;
  salonDisplayId?: number;
  serviceId?: string;
  serviceDisplayId?: number;
  stylistId?: string;
  stylistDisplayId?: number;
  bookingId?: string;
  bookingDisplayId?: number;
  
  // User context
  userRole?: UserRole;
  deviceType?: DeviceType;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  
  // Additional metadata
  metadata?: Record<string, any>;
  duration?: number;
  errorCode?: string;
  errorMessage?: string;
}

// Analytics Query Filters
export interface AnalyticsQueryFilters {
  userId?: string;
  sessionId?: string;
  eventType?: AnalyticsEventType;
  page?: string;
  action?: string;
  salonId?: string;
  serviceId?: string;
  stylistId?: string;
  bookingId?: string;
  userRole?: UserRole;
  deviceType?: DeviceType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// Analytics Aggregation Results
export interface AnalyticsAggregation {
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  averageDuration?: number;
  topPages: Array<{ page: string; count: number }>;
  topActions: Array<{ action: string; count: number }>;
  deviceBreakdown: Array<{ deviceType: DeviceType; count: number }>;
  userRoleBreakdown: Array<{ userRole: UserRole; count: number }>;
}

// Business Intelligence Metrics
export interface BusinessMetrics {
  // Booking funnel metrics
  bookingFunnel: {
    salonViews: number;
    serviceViews: number;
    stylistViews: number;
    bookingAttempts: number;
    bookingCompletions: number;
    conversionRate: number;
  };
  
  // Popular content
  popularSalons: Array<{
    salonId: string;
    salonName: string;
    displayId: number;
    views: number;
    bookings: number;
    conversionRate: number;
  }>;
  
  popularServices: Array<{
    serviceId: string;
    serviceName: string;
    displayId: number;
    views: number;
    bookings: number;
    conversionRate: number;
  }>;
  
  popularStylists: Array<{
    stylistId: string;
    stylistName: string;
    displayId: number;
    views: number;
    bookings: number;
    conversionRate: number;
  }>;
  
  // User behavior
  userEngagement: {
    averageSessionDuration: number;
    averagePagesPerSession: number;
    bounceRate: number;
    returnUserRate: number;
  };
  
  // Peak times
  peakHours: Array<{ hour: number; count: number }>;
  peakDays: Array<{ day: string; count: number }>;
}

// Real-time Analytics
export interface RealTimeMetrics {
  activeUsers: number;
  activeSessions: number;
  currentPageViews: Array<{ page: string; count: number }>;
  recentActions: Array<{
    eventType: AnalyticsEventType;
    page: string;
    action?: string;
    timestamp: Date;
    userRole?: UserRole;
  }>;
}

// Communication Metrics
export interface CommunicationMetrics {
  sms: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
  };
  email: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
  whatsapp: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
  };
  topTemplates: Array<{
    template: string;
    count: number;
  }>;
}

// Analytics Dashboard Data
export interface AnalyticsDashboardData {
  overview: AnalyticsAggregation;
  businessMetrics: BusinessMetrics;
  realTime: RealTimeMetrics;
  communications: CommunicationMetrics;
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
}

// Session Analytics
export interface SessionAnalytics {
  sessionId: string;
  userId?: string;
  userRole?: UserRole;
  deviceType?: DeviceType;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  actions: number;
  conversions: number;
  pages: Array<{
    page: string;
    timestamp: Date;
    duration?: number;
  }>;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

// Error Analytics
export interface ErrorAnalytics {
  errorCode: string;
  errorMessage: string;
  count: number;
  affectedUsers: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  pages: Array<{ page: string; count: number }>;
  userRoles: Array<{ userRole: UserRole; count: number }>;
  deviceTypes: Array<{ deviceType: DeviceType; count: number }>;
}
