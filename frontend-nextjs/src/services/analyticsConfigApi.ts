import { env } from '../config/env';

const API_BASE_URL = env.API_URL;

export interface AnalyticsConfigData {
  // Custom Analytics System (CutQ Internal)
  trackPageViews: boolean;
  trackUserActions: boolean;
  trackConversions: boolean;
  trackErrors: boolean;

  // Communication Tracking
  trackSmsMessages: boolean;
  trackEmailMessages: boolean;
  trackWhatsappMessages: boolean;

  // Business Analytics
  trackBookingFunnel: boolean;
  trackSalonViews: boolean;
  trackServiceViews: boolean;
  trackStylistViews: boolean;

  // Real-time Analytics
  trackActiveSessions: boolean;
  trackRealTimeActions: boolean;

  // Google Analytics (External) - separate from custom analytics
  enableGoogleAnalytics: boolean;
  googleAnalyticsPageViews: boolean;
  googleAnalyticsEvents: boolean;
  googleAnalyticsConversions: boolean;
  googleAnalyticsErrors: boolean;
  googleAnalyticsWebVitals: boolean;

  // Data Retention (in days)
  pageViewRetentionDays: number;
  communicationRetentionDays: number;
  businessRetentionDays: number;

  // Auto-cleanup settings
  enableAutoCleanup: boolean;
  cleanupFrequencyDays: number;
}

export interface AnalyticsConfigResponse {
  success: boolean;
  data: AnalyticsConfigData;
  message?: string;
}

export interface TrackingStatusResponse {
  success: boolean;
  data: {
    trackingType: string;
    enabled: boolean;
  };
}

class AnalyticsConfigApi {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Get current analytics configuration
   */
  async getConfig(): Promise<AnalyticsConfigData> {
    const response = await fetch(`${API_BASE_URL}/analytics-config`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get analytics config: ${response.statusText}`);
    }

    const result: AnalyticsConfigResponse = await response.json();
    return result.data;
  }

  /**
   * Update analytics configuration
   */
  async updateConfig(updates: Partial<AnalyticsConfigData>): Promise<AnalyticsConfigData> {
    const response = await fetch(`${API_BASE_URL}/analytics-config`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update analytics config: ${response.statusText}`);
    }

    const result: AnalyticsConfigResponse = await response.json();
    return result.data;
  }

  /**
   * Reset analytics configuration to defaults
   */
  async resetConfig(): Promise<AnalyticsConfigData> {
    const response = await fetch(`${API_BASE_URL}/analytics-config/reset`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to reset analytics config: ${response.statusText}`);
    }

    const result: AnalyticsConfigResponse = await response.json();
    return result.data;
  }

  /**
   * Check if specific tracking type is enabled
   */
  async getTrackingStatus(trackingType: keyof AnalyticsConfigData): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/analytics-config/status/${trackingType}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get tracking status: ${response.statusText}`);
    }

    const result: TrackingStatusResponse = await response.json();
    return result.data.enabled;
  }

  /**
   * Bulk update multiple tracking settings
   */
  async updateTrackingSettings(settings: {
    [K in keyof AnalyticsConfigData]?: AnalyticsConfigData[K];
  }): Promise<AnalyticsConfigData> {
    return this.updateConfig(settings);
  }

  /**
   * Update communication tracking settings
   */
  async updateCommunicationTracking(settings: {
    trackSmsMessages?: boolean;
    trackEmailMessages?: boolean;
    trackWhatsappMessages?: boolean;
  }): Promise<AnalyticsConfigData> {
    return this.updateConfig(settings);
  }

  /**
   * Update page tracking settings
   */
  async updatePageTracking(settings: {
    trackPageViews?: boolean;
    trackUserActions?: boolean;
    trackConversions?: boolean;
    trackErrors?: boolean;
  }): Promise<AnalyticsConfigData> {
    return this.updateConfig(settings);
  }

  /**
   * Update business analytics settings
   */
  async updateBusinessTracking(settings: {
    trackBookingFunnel?: boolean;
    trackSalonViews?: boolean;
    trackServiceViews?: boolean;
    trackStylistViews?: boolean;
  }): Promise<AnalyticsConfigData> {
    return this.updateConfig(settings);
  }

  /**
   * Update data retention settings
   */
  async updateRetentionSettings(settings: {
    pageViewRetentionDays?: number;
    communicationRetentionDays?: number;
    businessRetentionDays?: number;
    enableAutoCleanup?: boolean;
    cleanupFrequencyDays?: number;
  }): Promise<AnalyticsConfigData> {
    return this.updateConfig(settings);
  }
}

export const analyticsConfigApi = new AnalyticsConfigApi();
