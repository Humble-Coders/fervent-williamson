import { buildApiUrl } from '../config/env';

// Analytics API interfaces
export interface AnalyticsOverview {
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  averageDuration?: number;
  topPages: Array<{ page: string; count: number }>;
  topActions: Array<{ action: string; count: number }>;
  deviceBreakdown: Array<{ deviceType: string; count: number }>;
  userRoleBreakdown: Array<{ userRole: string; count: number }>;
}

export interface BusinessMetrics {
  bookingFunnel: {
    salonViews: number;
    serviceViews: number;
    stylistViews: number;
    bookingAttempts: number;
    bookingCompletions: number;
    conversionRate: number;
  };
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
  userEngagement: {
    averageSessionDuration: number;
    averagePagesPerSession: number;
    bounceRate: number;
    returnUserRate: number;
  };
  peakHours: Array<{ hour: number; count: number }>;
  peakDays: Array<{ day: string; count: number }>;
}

export interface RealTimeMetrics {
  activeUsers: number;
  activeSessions: number;
  currentPageViews: Array<{ page: string; count: number }>;
  recentActions: Array<{
    eventType: string;
    page: string;
    action?: string;
    timestamp: string;
    userRole?: string;
  }>;
}

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

export interface AnalyticsDashboardData {
  overview: AnalyticsOverview;
  businessMetrics: BusinessMetrics;
  realTime: RealTimeMetrics;
  communications?: CommunicationMetrics;
  timeRange: {
    startDate: string;
    endDate: string;
  };
}

export interface AnalyticsQueryFilters {
  startDate?: string;
  endDate?: string;
  salonId?: string;
  serviceId?: string;
  stylistId?: string;
  userId?: string;
  userRole?: string;
  deviceType?: string;
  eventType?: string;
  page?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

// Analytics API service
class AnalyticsApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    };
  }

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(buildApiUrl(`analytics/${endpoint}`), {
      headers: this.getAuthHeaders(),
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  // Get complete dashboard data
  async getDashboardData(filters?: AnalyticsQueryFilters): Promise<AnalyticsDashboardData> {
    const queryParams = new URLSearchParams();
    
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);

    const endpoint = `dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest<AnalyticsDashboardData>(endpoint);
  }

  // Get analytics overview
  async getOverview(filters?: AnalyticsQueryFilters): Promise<AnalyticsOverview> {
    const queryParams = new URLSearchParams();
    
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);

    const endpoint = `overview${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest<AnalyticsOverview>(endpoint);
  }

  // Get business metrics
  async getBusinessMetrics(filters?: AnalyticsQueryFilters): Promise<BusinessMetrics> {
    const queryParams = new URLSearchParams();
    
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);

    const endpoint = `business-metrics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest<BusinessMetrics>(endpoint);
  }

  // Get real-time metrics
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    return this.makeRequest<RealTimeMetrics>('real-time');
  }

  // Get communication metrics
  async getCommunicationMetrics(filters?: AnalyticsQueryFilters): Promise<CommunicationMetrics> {
    const queryParams = new URLSearchParams();

    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.salonId) queryParams.append('salonId', filters.salonId);
    if (filters?.userId) queryParams.append('userId', filters.userId);

    const endpoint = `communications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest<CommunicationMetrics>(endpoint);
  }

  // Get analytics events
  async getEvents(filters?: AnalyticsQueryFilters): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `events${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest<any[]>(endpoint);
  }

  // Get session analytics
  async getSessionAnalytics(sessionId: string): Promise<any> {
    return this.makeRequest<any>(`session/${sessionId}`);
  }

  // Get salon-specific analytics
  async getSalonAnalytics(salonId: string, filters?: AnalyticsQueryFilters): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);

    const endpoint = `salon/${salonId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest<any>(endpoint);
  }

  // Clean up old data
  async cleanupOldData(daysToKeep: number = 90): Promise<{ deletedCount: number; daysToKeep: number }> {
    return this.makeRequest<{ deletedCount: number; daysToKeep: number }>(`cleanup?days=${daysToKeep}`, {
      method: 'DELETE'
    });
  }

  // Track custom event
  async trackEvent(eventData: any): Promise<void> {
    await this.makeRequest<void>('track', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  }
}

// Export singleton instance
export const analyticsApi = new AnalyticsApiService();

// Date range presets for dashboard filters
export const DATE_RANGE_PRESETS = {
  TODAY: {
    label: 'Today',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  YESTERDAY: {
    label: 'Yesterday',
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },
  LAST_7_DAYS: {
    label: 'Last 7 Days',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  LAST_30_DAYS: {
    label: 'Last 30 Days',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  LAST_90_DAYS: {
    label: 'Last 90 Days',
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  THIS_MONTH: {
    label: 'This Month',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  LAST_MONTH: {
    label: 'Last Month',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
  }
};

// Utility functions for analytics data processing
export const analyticsUtils = {
  formatNumber: (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  },

  formatPercentage: (num: number): string => {
    return `${num.toFixed(1)}%`;
  },

  formatDuration: (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  },

  getDateRangeLabel: (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString();
    }
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  },

  calculateGrowthRate: (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
};
