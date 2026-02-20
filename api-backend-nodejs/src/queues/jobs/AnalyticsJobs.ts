/**
 * Analytics Jobs
 * Job processors for analytics events - ensures analytics never block main functionality
 */

import Bull = require('bull');
import { queueManager } from '../QueueManager';
import { PrismaClient, AnalyticsEventType } from '@prisma/client';
import { isDevelopment } from '../../config/env';
import { analyticsConfigService } from '../../services/analyticsConfigService';

const prisma = new PrismaClient();

// Job data interfaces
export interface AnalyticsEventJobData {
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
  userRole?: string;
  deviceType?: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;

  // Additional metadata
  metadata?: any;
  duration?: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface CommunicationTrackingJobData {
  userId?: string;
  sessionId?: string;
  communicationType: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH' | 'IN_APP';
  communicationStatus: 'SENT' | 'DELIVERED' | 'FAILED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'UNSUBSCRIBED';
  recipientPhone?: string;
  recipientEmail?: string;
  messageTemplate: string;
  messageContent?: string;
  providerId?: string;
  salonId?: string;
  bookingId?: string;
  serviceId?: string;
  metadata?: any;
}

export interface CommunicationStatusUpdateJobData {
  eventId: string;
  status: 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'UNSUBSCRIBED';
  timestamp?: Date;
}

export class AnalyticsJobs {
  private static readonly QUEUE_NAME = 'analytics-events';
  
  /**
   * Initialize job processors
   */
  public static init(): void {
    // Process general analytics events
    queueManager.processJobs(
      this.QUEUE_NAME,
      'analytics-event',
      this.processAnalyticsEvent.bind(this),
      5 // Process 5 jobs concurrently for high throughput
    );

    // Process communication tracking events
    queueManager.processJobs(
      this.QUEUE_NAME,
      'communication-tracking',
      this.processCommunicationTracking.bind(this),
      3 // Process 3 communication jobs concurrently
    );

    // Process communication status updates
    queueManager.processJobs(
      this.QUEUE_NAME,
      'communication-status-update',
      this.processCommunicationStatusUpdate.bind(this),
      2 // Process 2 status update jobs concurrently
    );

    console.log('📊 Analytics job processors initialized');
  }

  /**
   * Add analytics event job (non-blocking)
   */
  public static async addAnalyticsEventJob(data: AnalyticsEventJobData): Promise<Bull.Job> {
    return queueManager.addJob(
      this.QUEUE_NAME,
      'analytics-event',
      data,
      {
        attempts: 2, // Lower attempts for analytics (not critical)
        delay: 0, // Process immediately
        backoff: {
          type: 'fixed',
          delay: 1000,
        },
        removeOnComplete: 50, // Keep more completed jobs for monitoring
        removeOnFail: 20,
      }
    );
  }

  /**
   * Add communication tracking job (non-blocking)
   */
  public static async addCommunicationTrackingJob(data: CommunicationTrackingJobData): Promise<Bull.Job> {
    return queueManager.addJob(
      this.QUEUE_NAME,
      'communication-tracking',
      data,
      {
        attempts: 3, // Higher attempts for communication tracking
        delay: 0,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );
  }

  /**
   * Add communication status update job (non-blocking)
   */
  public static async addCommunicationStatusUpdateJob(data: CommunicationStatusUpdateJobData): Promise<Bull.Job> {
    return queueManager.addJob(
      this.QUEUE_NAME,
      'communication-status-update',
      data,
      {
        attempts: 2,
        delay: 0,
        backoff: {
          type: 'fixed',
          delay: 500,
        },
        removeOnComplete: 30,
        removeOnFail: 10,
      }
    );
  }

  /**
   * Process analytics event job
   */
  private static async processAnalyticsEvent(job: Bull.Job<AnalyticsEventJobData>): Promise<void> {
    const data = job.data;

    try {
      // Check if tracking is enabled for this event type
      let trackingEnabled = false;

      switch (data.eventType) {
        case 'PAGE_VIEW':
          trackingEnabled = await analyticsConfigService.isTrackingEnabled('trackPageViews');
          break;
        case 'ACTION':
          trackingEnabled = await analyticsConfigService.isTrackingEnabled('trackUserActions');
          break;
        case 'CONVERSION':
          trackingEnabled = await analyticsConfigService.isTrackingEnabled('trackConversions');
          break;
        case 'ERROR':
          trackingEnabled = await analyticsConfigService.isTrackingEnabled('trackErrors');
          break;
        default:
          trackingEnabled = true; // Default to enabled for unknown types
      }

      if (!trackingEnabled) {
        if (isDevelopment) {
          console.log(`📊 Analytics tracking disabled for ${data.eventType}`);
        }
        return;
      }

      await prisma.analyticsEvent.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId || `analytics_${Date.now()}`,
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
          userRole: data.userRole as any,
          deviceType: data.deviceType as any,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          referrer: data.referrer,
          metadata: data.metadata,
          duration: data.duration,
          errorCode: data.errorCode,
          errorMessage: data.errorMessage,
        }
      });

      if (isDevelopment) {
        console.log(`📊 Analytics event processed: ${data.eventType} - ${data.page}`);
      }
    } catch (error) {
      console.error('❌ Failed to process analytics event:', error);
      throw error; // Re-throw to trigger retry
    }
  }

  /**
   * Process communication tracking job - using new CommunicationAnalytics table
   */
  private static async processCommunicationTracking(job: Bull.Job<CommunicationTrackingJobData>): Promise<void> {
    const data = job.data;

    try {
      // Check if communication tracking is enabled for this type
      const communicationType = data.communicationType.toLowerCase();
      let trackingEnabled = false;

      switch (communicationType) {
        case 'sms':
          trackingEnabled = await analyticsConfigService.isTrackingEnabled('trackSmsMessages');
          break;
        case 'email':
          trackingEnabled = await analyticsConfigService.isTrackingEnabled('trackEmailMessages');
          break;
        case 'whatsapp':
          trackingEnabled = await analyticsConfigService.isTrackingEnabled('trackWhatsappMessages');
          break;
        default:
          trackingEnabled = true; // Default to enabled for unknown types
      }

      if (!trackingEnabled) {
        console.log(`📱 Communication tracking disabled for ${data.communicationType}`);
        return;
      }

      // Store in the new CommunicationAnalytics table
      await prisma.communicationAnalytics.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId || `comm_${Date.now()}`,
          communicationType: data.communicationType as any, // Cast to enum
          communicationStatus: data.communicationStatus as any, // Cast to enum
          recipientPhone: data.recipientPhone,
          recipientEmail: data.recipientEmail,
          messageTemplate: data.messageTemplate,
          salonId: data.salonId,
          bookingId: data.bookingId,
          metadata: data.metadata,
        }
      });

      console.log(`📱 Communication tracked: ${data.communicationType} - ${data.communicationStatus}`);
    } catch (error) {
      console.error('❌ Failed to process communication tracking:', error);
      throw error;
    }
  }

  /**
   * Process communication status update job
   */
  private static async processCommunicationStatusUpdate(job: Bull.Job<CommunicationStatusUpdateJobData>): Promise<void> {
    const data = job.data;
    
    try {
      const updateData: any = {
        communicationStatus: data.status
      };

      if (data.status === 'DELIVERED' && data.timestamp) {
        updateData.deliveryTime = data.timestamp;
      } else if (data.status === 'OPENED' && data.timestamp) {
        updateData.openedAt = data.timestamp;
      } else if (data.status === 'CLICKED' && data.timestamp) {
        updateData.clickedAt = data.timestamp;
      }

      await prisma.analyticsEvent.update({
        where: { id: data.eventId },
        data: updateData
      });

      console.log(`📊 Communication status updated: ${data.eventId} - ${data.status}`);
    } catch (error) {
      console.error('❌ Failed to update communication status:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  public static async getQueueStats(): Promise<any> {
    const queue = queueManager.getQueue(this.QUEUE_NAME);
    return {
      waiting: await queue.getWaiting(),
      active: await queue.getActive(),
      completed: await queue.getCompleted(),
      failed: await queue.getFailed(),
      delayed: await queue.getDelayed(),
    };
  }
}
