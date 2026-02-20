import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnalyticsConfigData {
  // Custom Analytics System (CutQ Internal)
  // Page View Tracking
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

  // Google Analytics (External)
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

class AnalyticsConfigService {
  private static instance: AnalyticsConfigService;
  private config: AnalyticsConfigData | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): AnalyticsConfigService {
    if (!AnalyticsConfigService.instance) {
      AnalyticsConfigService.instance = new AnalyticsConfigService();
    }
    return AnalyticsConfigService.instance;
  }

  /**
   * Get analytics configuration with caching
   */
  async getConfig(): Promise<AnalyticsConfigData> {
    const now = Date.now();

    // Return cached config if still valid
    if (this.config && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.config;
    }

    try {
      // Get analytics configs from system_config table
      const configs = await prisma.systemConfig.findMany({
        where: {
          key: {
            startsWith: 'analytics_'
          }
        }
      });

      if (configs.length > 0) {
        // Convert system configs to analytics config format
        const configMap = new Map(configs.map(c => [c.key, c.value]));

        this.config = {
          // Custom Analytics System (CutQ Internal)
          trackPageViews: this.getBooleanConfig(configMap, 'analytics_track_page_views', false),
          trackUserActions: this.getBooleanConfig(configMap, 'analytics_track_user_actions', false),
          trackConversions: this.getBooleanConfig(configMap, 'analytics_track_conversions', false),
          trackErrors: this.getBooleanConfig(configMap, 'analytics_track_errors', false),

          // Communication Tracking
          trackSmsMessages: this.getBooleanConfig(configMap, 'analytics_track_sms_messages', false),
          trackEmailMessages: this.getBooleanConfig(configMap, 'analytics_track_email_messages', false),
          trackWhatsappMessages: this.getBooleanConfig(configMap, 'analytics_track_whatsapp_messages', false),

          // Business Analytics
          trackBookingFunnel: this.getBooleanConfig(configMap, 'analytics_track_booking_funnel', false),
          trackSalonViews: this.getBooleanConfig(configMap, 'analytics_track_salon_views', false),
          trackServiceViews: this.getBooleanConfig(configMap, 'analytics_track_service_views', false),
          trackStylistViews: this.getBooleanConfig(configMap, 'analytics_track_stylist_views', false),

          // Real-time Analytics
          trackActiveSessions: this.getBooleanConfig(configMap, 'analytics_track_active_sessions', false),
          trackRealTimeActions: this.getBooleanConfig(configMap, 'analytics_track_real_time_actions', false),

          // Google Analytics (External)
          enableGoogleAnalytics: this.getBooleanConfig(configMap, 'analytics_enable_google_analytics', false),
          googleAnalyticsPageViews: this.getBooleanConfig(configMap, 'analytics_google_analytics_page_views', false),
          googleAnalyticsEvents: this.getBooleanConfig(configMap, 'analytics_google_analytics_events', false),
          googleAnalyticsConversions: this.getBooleanConfig(configMap, 'analytics_google_analytics_conversions', false),
          googleAnalyticsErrors: this.getBooleanConfig(configMap, 'analytics_google_analytics_errors', false),
          googleAnalyticsWebVitals: this.getBooleanConfig(configMap, 'analytics_google_analytics_web_vitals', false),

          // Data Retention
          pageViewRetentionDays: this.getNumberConfig(configMap, 'analytics_page_view_retention_days', 90),
          communicationRetentionDays: this.getNumberConfig(configMap, 'analytics_communication_retention_days', 365),
          businessRetentionDays: this.getNumberConfig(configMap, 'analytics_business_retention_days', 365),

          // Auto-cleanup settings
          enableAutoCleanup: this.getBooleanConfig(configMap, 'analytics_enable_auto_cleanup', true),
          cleanupFrequencyDays: this.getNumberConfig(configMap, 'analytics_cleanup_frequency_days', 7),
        };
      } else {
        // Create default config if none exists
        this.config = await this.createDefaultConfig();
      }

      this.lastFetch = now;
      return this.config;
    } catch (error) {
      console.error('Failed to get analytics config, using defaults:', error);
      // Return default config if database fails
      return this.getDefaultConfig();
    }
  }

  /**
   * Update analytics configuration
   */
  async updateConfig(updates: Partial<AnalyticsConfigData>): Promise<AnalyticsConfigData> {
    try {
      // Map of config keys to update
      const configUpdates = new Map<string, any>();

      // Map updates to system_config keys
      if (updates.trackPageViews !== undefined) {
        configUpdates.set('analytics_track_page_views', updates.trackPageViews);
      }
      if (updates.trackUserActions !== undefined) {
        configUpdates.set('analytics_track_user_actions', updates.trackUserActions);
      }
      if (updates.trackConversions !== undefined) {
        configUpdates.set('analytics_track_conversions', updates.trackConversions);
      }
      if (updates.trackErrors !== undefined) {
        configUpdates.set('analytics_track_errors', updates.trackErrors);
      }
      if (updates.trackSmsMessages !== undefined) {
        configUpdates.set('analytics_track_sms_messages', updates.trackSmsMessages);
      }
      if (updates.trackEmailMessages !== undefined) {
        configUpdates.set('analytics_track_email_messages', updates.trackEmailMessages);
      }
      if (updates.trackWhatsappMessages !== undefined) {
        configUpdates.set('analytics_track_whatsapp_messages', updates.trackWhatsappMessages);
      }
      if (updates.trackBookingFunnel !== undefined) {
        configUpdates.set('analytics_track_booking_funnel', updates.trackBookingFunnel);
      }
      if (updates.trackSalonViews !== undefined) {
        configUpdates.set('analytics_track_salon_views', updates.trackSalonViews);
      }
      if (updates.trackServiceViews !== undefined) {
        configUpdates.set('analytics_track_service_views', updates.trackServiceViews);
      }
      if (updates.trackStylistViews !== undefined) {
        configUpdates.set('analytics_track_stylist_views', updates.trackStylistViews);
      }
      if (updates.trackActiveSessions !== undefined) {
        configUpdates.set('analytics_track_active_sessions', updates.trackActiveSessions);
      }
      if (updates.trackRealTimeActions !== undefined) {
        configUpdates.set('analytics_track_real_time_actions', updates.trackRealTimeActions);
      }
      if (updates.pageViewRetentionDays !== undefined) {
        configUpdates.set('analytics_page_view_retention_days', updates.pageViewRetentionDays);
      }
      if (updates.communicationRetentionDays !== undefined) {
        configUpdates.set('analytics_communication_retention_days', updates.communicationRetentionDays);
      }
      if (updates.businessRetentionDays !== undefined) {
        configUpdates.set('analytics_business_retention_days', updates.businessRetentionDays);
      }
      if (updates.enableAutoCleanup !== undefined) {
        configUpdates.set('analytics_enable_auto_cleanup', updates.enableAutoCleanup);
      }
      if (updates.cleanupFrequencyDays !== undefined) {
        configUpdates.set('analytics_cleanup_frequency_days', updates.cleanupFrequencyDays);
      }

      // Google Analytics settings
      if (updates.enableGoogleAnalytics !== undefined) {
        configUpdates.set('analytics_enable_google_analytics', updates.enableGoogleAnalytics);
      }
      if (updates.googleAnalyticsPageViews !== undefined) {
        configUpdates.set('analytics_google_analytics_page_views', updates.googleAnalyticsPageViews);
      }
      if (updates.googleAnalyticsEvents !== undefined) {
        configUpdates.set('analytics_google_analytics_events', updates.googleAnalyticsEvents);
      }
      if (updates.googleAnalyticsConversions !== undefined) {
        configUpdates.set('analytics_google_analytics_conversions', updates.googleAnalyticsConversions);
      }
      if (updates.googleAnalyticsErrors !== undefined) {
        configUpdates.set('analytics_google_analytics_errors', updates.googleAnalyticsErrors);
      }
      if (updates.googleAnalyticsWebVitals !== undefined) {
        configUpdates.set('analytics_google_analytics_web_vitals', updates.googleAnalyticsWebVitals);
      }

      // Update each config in system_config table
      for (const [configKey, configValue] of configUpdates) {
        await prisma.systemConfig.upsert({
          where: { key: configKey },
          update: {
            value: String(configValue),
            updatedAt: new Date()
          },
          create: {
            key: configKey,
            value: String(configValue)
          }
        });
      }

      // Clear cache and return updated config
      this.config = null;
      this.lastFetch = 0;
      return await this.getConfig();
    } catch (error) {
      console.error('Failed to update analytics config:', error);
      throw new Error('Failed to update analytics configuration');
    }
  }

  /**
   * Helper method to get boolean config value
   */
  private getBooleanConfig(configMap: Map<string, any>, key: string, defaultValue: boolean): boolean {
    const value = configMap.get(key);
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return Boolean(value);
  }

  /**
   * Helper method to get number config value
   */
  private getNumberConfig(configMap: Map<string, any>, key: string, defaultValue: number): number {
    const value = configMap.get(key);
    if (value === null || value === undefined) return defaultValue;
    const numValue = Number(value);
    return isNaN(numValue) ? defaultValue : numValue;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.config = null;
    this.lastFetch = 0;
  }

  /**
   * Create default configuration in database
   */
  private async createDefaultConfig(): Promise<AnalyticsConfigData> {
    const defaultConfig = this.getDefaultConfig();

    try {
      // Create default analytics configs in system_config table
      const defaultConfigs = [
        // Custom Analytics System (CutQ Internal)
        { key: 'analytics_track_page_views', value: defaultConfig.trackPageViews, desc: 'Track page views (Custom Analytics)' },
        { key: 'analytics_track_user_actions', value: defaultConfig.trackUserActions, desc: 'Track user actions (Custom Analytics)' },
        { key: 'analytics_track_conversions', value: defaultConfig.trackConversions, desc: 'Track conversions (Custom Analytics)' },
        { key: 'analytics_track_errors', value: defaultConfig.trackErrors, desc: 'Track errors (Custom Analytics)' },
        { key: 'analytics_track_sms_messages', value: defaultConfig.trackSmsMessages, desc: 'Track SMS messages' },
        { key: 'analytics_track_email_messages', value: defaultConfig.trackEmailMessages, desc: 'Track email messages' },
        { key: 'analytics_track_whatsapp_messages', value: defaultConfig.trackWhatsappMessages, desc: 'Track WhatsApp messages' },
        { key: 'analytics_track_booking_funnel', value: defaultConfig.trackBookingFunnel, desc: 'Track booking funnel' },
        { key: 'analytics_track_salon_views', value: defaultConfig.trackSalonViews, desc: 'Track salon views' },
        { key: 'analytics_track_service_views', value: defaultConfig.trackServiceViews, desc: 'Track service views' },
        { key: 'analytics_track_stylist_views', value: defaultConfig.trackStylistViews, desc: 'Track stylist views' },
        { key: 'analytics_track_active_sessions', value: defaultConfig.trackActiveSessions, desc: 'Track active sessions' },
        { key: 'analytics_track_real_time_actions', value: defaultConfig.trackRealTimeActions, desc: 'Track real-time actions' },

        // Google Analytics (External)
        { key: 'analytics_enable_google_analytics', value: defaultConfig.enableGoogleAnalytics, desc: 'Enable Google Analytics' },
        { key: 'analytics_google_analytics_page_views', value: defaultConfig.googleAnalyticsPageViews, desc: 'Google Analytics page views' },
        { key: 'analytics_google_analytics_events', value: defaultConfig.googleAnalyticsEvents, desc: 'Google Analytics events' },
        { key: 'analytics_google_analytics_conversions', value: defaultConfig.googleAnalyticsConversions, desc: 'Google Analytics conversions' },
        { key: 'analytics_google_analytics_errors', value: defaultConfig.googleAnalyticsErrors, desc: 'Google Analytics errors' },
        { key: 'analytics_google_analytics_web_vitals', value: defaultConfig.googleAnalyticsWebVitals, desc: 'Google Analytics web vitals' },

        // Data Retention and Cleanup
        { key: 'analytics_page_view_retention_days', value: defaultConfig.pageViewRetentionDays, desc: 'Page view retention days' },
        { key: 'analytics_communication_retention_days', value: defaultConfig.communicationRetentionDays, desc: 'Communication retention days' },
        { key: 'analytics_business_retention_days', value: defaultConfig.businessRetentionDays, desc: 'Business retention days' },
        { key: 'analytics_enable_auto_cleanup', value: defaultConfig.enableAutoCleanup, desc: 'Enable auto cleanup' },
        { key: 'analytics_cleanup_frequency_days', value: defaultConfig.cleanupFrequencyDays, desc: 'Cleanup frequency days' },
      ];

      for (const config of defaultConfigs) {
        await prisma.systemConfig.upsert({
          where: { key: config.key },
          update: { value: String(config.value) },
          create: {
            key: config.key,
            value: String(config.value)
          }
        });
      }

      return defaultConfig;
    } catch (error) {
      console.error('Failed to create default analytics config:', error);
      return defaultConfig;
    }
  }

  /**
   * Get default configuration values
   */
  private getDefaultConfig(): AnalyticsConfigData {
    return {
      // Custom Analytics System (CutQ Internal)
      trackPageViews: false,
      trackUserActions: false,
      trackConversions: false,
      trackErrors: false,

      // Communication Tracking
      trackSmsMessages: false,
      trackEmailMessages: false,
      trackWhatsappMessages: false,

      // Business Analytics
      trackBookingFunnel: false,
      trackSalonViews: false,
      trackServiceViews: false,
      trackStylistViews: false,

      // Real-time Analytics
      trackActiveSessions: false,
      trackRealTimeActions: false,

      // Google Analytics (External) - separate from custom analytics
      enableGoogleAnalytics: false,
      googleAnalyticsPageViews: false,
      googleAnalyticsEvents: false,
      googleAnalyticsConversions: false,
      googleAnalyticsErrors: false,
      googleAnalyticsWebVitals: false,

      // Data Retention (in days)
      pageViewRetentionDays: 90,
      communicationRetentionDays: 365,
      businessRetentionDays: 365,

      // Auto-cleanup settings
      enableAutoCleanup: true,
      cleanupFrequencyDays: 7,
    };
  }

  /**
   * Check if a specific tracking type is enabled
   */
  async isTrackingEnabled(trackingType: keyof AnalyticsConfigData): Promise<boolean> {
    try {
      const config = await this.getConfig();
      return config[trackingType] as boolean;
    } catch (error) {
      console.error(`Failed to check tracking status for ${trackingType}:`, error);
      // Default to false if we can't determine the setting
      return false;
    }
  }

  /**
   * Check if all analytics tracking is disabled
   */
  async isAllTrackingDisabled(): Promise<boolean> {
    try {
      const config = await this.getConfig();
      return !config.trackPageViews &&
             !config.trackUserActions &&
             !config.trackConversions &&
             !config.trackErrors &&
             !config.trackSmsMessages &&
             !config.trackEmailMessages &&
             !config.trackWhatsappMessages &&
             !config.trackBookingFunnel &&
             !config.trackSalonViews &&
             !config.trackServiceViews &&
             !config.trackStylistViews &&
             !config.trackActiveSessions &&
             !config.trackRealTimeActions;
    } catch (error) {
      console.error('Failed to check if all tracking is disabled:', error);
      // Default to disabled if we can't determine the setting
      return true;
    }
  }
}

export const analyticsConfigService = AnalyticsConfigService.getInstance();
