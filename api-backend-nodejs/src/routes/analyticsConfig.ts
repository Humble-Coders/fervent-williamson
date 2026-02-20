import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireAdmin } from '../middleware/simpleAuth';
import { analyticsConfigService, AnalyticsConfigData } from '../services/analyticsConfigService';

const router = express.Router();

// Validation schema for analytics config updates
const analyticsConfigUpdateSchema = z.object({
  // Custom Analytics System (CutQ Internal)
  trackPageViews: z.boolean().optional(),
  trackUserActions: z.boolean().optional(),
  trackConversions: z.boolean().optional(),
  trackErrors: z.boolean().optional(),

  // Communication Tracking
  trackSmsMessages: z.boolean().optional(),
  trackEmailMessages: z.boolean().optional(),
  trackWhatsappMessages: z.boolean().optional(),

  // Business Analytics
  trackBookingFunnel: z.boolean().optional(),
  trackSalonViews: z.boolean().optional(),
  trackServiceViews: z.boolean().optional(),
  trackStylistViews: z.boolean().optional(),

  // Real-time Analytics
  trackActiveSessions: z.boolean().optional(),
  trackRealTimeActions: z.boolean().optional(),

  // Google Analytics (External) - separate from custom analytics
  enableGoogleAnalytics: z.boolean().optional(),
  googleAnalyticsPageViews: z.boolean().optional(),
  googleAnalyticsEvents: z.boolean().optional(),
  googleAnalyticsConversions: z.boolean().optional(),
  googleAnalyticsErrors: z.boolean().optional(),
  googleAnalyticsWebVitals: z.boolean().optional(),

  // Data Retention (in days)
  pageViewRetentionDays: z.number().min(1).max(3650).optional(),
  communicationRetentionDays: z.number().min(1).max(3650).optional(),
  businessRetentionDays: z.number().min(1).max(3650).optional(),

  // Auto-cleanup settings
  enableAutoCleanup: z.boolean().optional(),
  cleanupFrequencyDays: z.number().min(1).max(365).optional(),
});

/**
 * @swagger
 * /analytics-config/public:
 *   get:
 *     summary: Get public analytics configuration (no auth required)
 *     tags: [Analytics Config]
 *     responses:
 *       200:
 *         description: Public analytics configuration retrieved successfully
 */
router.get('/public', async (req, res) => {
  try {
    const config = await analyticsConfigService.getConfig();

    // Return only the tracking flags, not sensitive settings
    const publicConfig = {
      // Custom Analytics System (CutQ Internal)
      trackPageViews: config.trackPageViews,
      trackUserActions: config.trackUserActions,
      trackConversions: config.trackConversions,
      trackErrors: config.trackErrors,
      trackSmsMessages: config.trackSmsMessages,
      trackEmailMessages: config.trackEmailMessages,
      trackWhatsappMessages: config.trackWhatsappMessages,
      trackBookingFunnel: config.trackBookingFunnel,
      trackSalonViews: config.trackSalonViews,
      trackServiceViews: config.trackServiceViews,
      trackStylistViews: config.trackStylistViews,
      trackActiveSessions: config.trackActiveSessions,
      trackRealTimeActions: config.trackRealTimeActions,

      // Google Analytics (External)
      enableGoogleAnalytics: config.enableGoogleAnalytics,
      googleAnalyticsPageViews: config.googleAnalyticsPageViews,
      googleAnalyticsEvents: config.googleAnalyticsEvents,
      googleAnalyticsConversions: config.googleAnalyticsConversions,
      googleAnalyticsErrors: config.googleAnalyticsErrors,
      googleAnalyticsWebVitals: config.googleAnalyticsWebVitals
    };

    res.json({
      success: true,
      data: publicConfig
    });
  } catch (error) {
    console.error('Failed to get public analytics config:', error);
    // Return all disabled if config fails to load
    res.json({
      success: true,
      data: {
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
        googleAnalyticsWebVitals: false
      }
    });
  }
});

/**
 * @swagger
 * /analytics-config:
 *   get:
 *     summary: Get analytics configuration
 *     tags: [Analytics Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const config = await analyticsConfigService.getConfig();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Failed to get analytics config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics configuration'
    });
  }
});

/**
 * @swagger
 * /analytics-config:
 *   put:
 *     summary: Update analytics configuration
 *     tags: [Analytics Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trackPageViews:
 *                 type: boolean
 *               trackUserActions:
 *                 type: boolean
 *               trackConversions:
 *                 type: boolean
 *               trackErrors:
 *                 type: boolean
 *               trackSmsMessages:
 *                 type: boolean
 *               trackEmailMessages:
 *                 type: boolean
 *               trackWhatsappMessages:
 *                 type: boolean
 *               trackBookingFunnel:
 *                 type: boolean
 *               trackSalonViews:
 *                 type: boolean
 *               trackServiceViews:
 *                 type: boolean
 *               trackStylistViews:
 *                 type: boolean
 *               trackActiveSessions:
 *                 type: boolean
 *               trackRealTimeActions:
 *                 type: boolean
 *               pageViewRetentionDays:
 *                 type: number
 *               communicationRetentionDays:
 *                 type: number
 *               businessRetentionDays:
 *                 type: number
 *               enableAutoCleanup:
 *                 type: boolean
 *               cleanupFrequencyDays:
 *                 type: number
 *     responses:
 *       200:
 *         description: Analytics configuration updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const validatedData = analyticsConfigUpdateSchema.parse(req.body);
    
    const updatedConfig = await analyticsConfigService.updateConfig(validatedData);

    console.log('Analytics configuration updated', {
      updates: Object.keys(validatedData)
    });
    
    res.json({
      success: true,
      data: updatedConfig,
      message: 'Analytics configuration updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.issues
      });
    }

    console.error('Failed to update analytics config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update analytics configuration'
    });
  }
});

/**
 * @swagger
 * /analytics-config/reset:
 *   post:
 *     summary: Reset analytics configuration to defaults
 *     tags: [Analytics Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics configuration reset successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Clear cache and get default config
    analyticsConfigService.clearCache();
    
    // Reset to defaults by updating with default values
    const defaultConfig = {
      trackPageViews: true,
      trackUserActions: true,
      trackConversions: true,
      trackErrors: true,
      trackSmsMessages: true,
      trackEmailMessages: true,
      trackWhatsappMessages: true,
      trackBookingFunnel: true,
      trackSalonViews: true,
      trackServiceViews: true,
      trackStylistViews: true,
      trackActiveSessions: true,
      trackRealTimeActions: true,
      pageViewRetentionDays: 90,
      communicationRetentionDays: 365,
      businessRetentionDays: 365,
      enableAutoCleanup: true,
      cleanupFrequencyDays: 7,
    };
    
    const resetConfig = await analyticsConfigService.updateConfig(defaultConfig);

    console.log('Analytics configuration reset to defaults');
    
    res.json({
      success: true,
      data: resetConfig,
      message: 'Analytics configuration reset to defaults'
    });
  } catch (error) {
    console.error('Failed to reset analytics config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset analytics configuration'
    });
  }
});

/**
 * @swagger
 * /analytics-config/status/{trackingType}:
 *   get:
 *     summary: Check if specific tracking type is enabled
 *     tags: [Analytics Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackingType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [trackPageViews, trackUserActions, trackConversions, trackErrors, trackSmsMessages, trackEmailMessages, trackWhatsappMessages, trackBookingFunnel, trackSalonViews, trackServiceViews, trackStylistViews, trackActiveSessions, trackRealTimeActions]
 *     responses:
 *       200:
 *         description: Tracking status retrieved successfully
 *       400:
 *         description: Invalid tracking type
 *       401:
 *         description: Unauthorized
 */
router.get('/status/:trackingType', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { trackingType } = req.params;
    
    // Validate tracking type
    const validTrackingTypes = [
      'trackPageViews', 'trackUserActions', 'trackConversions', 'trackErrors',
      'trackSmsMessages', 'trackEmailMessages', 'trackWhatsappMessages',
      'trackBookingFunnel', 'trackSalonViews', 'trackServiceViews', 'trackStylistViews',
      'trackActiveSessions', 'trackRealTimeActions'
    ];
    
    if (!validTrackingTypes.includes(trackingType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tracking type'
      });
    }
    
    const isEnabled = await analyticsConfigService.isTrackingEnabled(trackingType as keyof AnalyticsConfigData);
    
    res.json({
      success: true,
      data: {
        trackingType,
        enabled: isEnabled
      }
    });
  } catch (error) {
    console.error('Failed to check tracking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check tracking status'
    });
  }
});

export default router;
