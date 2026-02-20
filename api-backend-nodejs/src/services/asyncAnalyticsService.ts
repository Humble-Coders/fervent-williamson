/**
 * Async Analytics Service
 * Non-blocking analytics service that uses queues for all analytics operations
 */

import { AnalyticsJobs } from '../queues/jobs/AnalyticsJobs';
import { AnalyticsEventType } from '@prisma/client';

export enum CommunicationType {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP'
}

export enum CommunicationStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  BOUNCED = 'BOUNCED',
  UNSUBSCRIBED = 'UNSUBSCRIBED'
}

export enum MessageTemplate {
  OTP_VERIFICATION = 'OTP_VERIFICATION',
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  BOOKING_CANCELLATION = 'BOOKING_CANCELLATION',
  WELCOME_MESSAGE = 'WELCOME_MESSAGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  REVIEW_REQUEST = 'REVIEW_REQUEST',
  PROMOTIONAL = 'PROMOTIONAL'
}

interface AnalyticsEventData {
  userId?: string;
  sessionId?: string;
  eventType: AnalyticsEventType;
  page: string;
  action?: string;
  salonId?: string;
  salonDisplayId?: number;
  serviceId?: string;
  serviceDisplayId?: number;
  stylistId?: string;
  stylistDisplayId?: number;
  bookingId?: string;
  bookingDisplayId?: number;
  userRole?: string;
  deviceType?: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  metadata?: any;
  duration?: number;
  errorCode?: string;
  errorMessage?: string;
}

interface CommunicationTrackingData {
  userId?: string;
  sessionId?: string;
  communicationType: CommunicationType;
  communicationStatus: CommunicationStatus;
  recipientPhone?: string;
  recipientEmail?: string;
  messageTemplate: MessageTemplate;
  messageContent?: string;
  providerId?: string;
  salonId?: string;
  bookingId?: string;
  serviceId?: string;
  metadata?: any;
}

export class AsyncAnalyticsService {
  /**
   * Track analytics event (non-blocking)
   */
  static async trackEvent(data: AnalyticsEventData): Promise<void> {
    try {
      // Ensure sessionId is provided
      const eventData = {
        ...data,
        sessionId: data.sessionId || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      await AnalyticsJobs.addAnalyticsEventJob(eventData);
    } catch (error) {
      // Log error but don't throw - analytics should never block main functionality
      console.error('Failed to queue analytics event:', error);
    }
  }

  /**
   * Track page view (non-blocking)
   */
  static async trackPageView(data: {
    userId?: string;
    sessionId: string;
    page: string;
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    salonId?: string;
    serviceId?: string;
    stylistId?: string;
    metadata?: any;
  }): Promise<void> {
    await this.trackEvent({
      ...data,
      eventType: AnalyticsEventType.PAGE_VIEW,
      action: 'page_view'
    });
  }

  /**
   * Track user action (non-blocking)
   */
  static async trackAction(data: {
    userId?: string;
    sessionId: string;
    page: string;
    action: string;
    userAgent?: string;
    ipAddress?: string;
    salonId?: string;
    serviceId?: string;
    stylistId?: string;
    bookingId?: string;
    metadata?: any;
    duration?: number;
  }): Promise<void> {
    await this.trackEvent({
      ...data,
      eventType: AnalyticsEventType.ACTION
    });
  }

  /**
   * Track conversion event (non-blocking)
   */
  static async trackConversion(data: {
    userId?: string;
    sessionId: string;
    page: string;
    action: string;
    salonId?: string;
    serviceId?: string;
    stylistId?: string;
    bookingId?: string;
    metadata?: any;
  }): Promise<void> {
    await this.trackEvent({
      ...data,
      eventType: AnalyticsEventType.CONVERSION
    });
  }

  /**
   * Track error (non-blocking)
   */
  static async trackError(data: {
    userId?: string;
    sessionId: string;
    page: string;
    errorCode: string;
    errorMessage: string;
    userAgent?: string;
    ipAddress?: string;
    metadata?: any;
  }): Promise<void> {
    await this.trackEvent({
      ...data,
      eventType: AnalyticsEventType.ERROR,
      action: 'error_occurred'
    });
  }

  /**
   * Track SMS communication (non-blocking)
   */
  static async trackSMS(data: {
    userId?: string;
    sessionId?: string;
    recipientPhone: string;
    messageTemplate: MessageTemplate;
    messageContent?: string;
    status: CommunicationStatus;
    providerId?: string;
    salonId?: string;
    bookingId?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await AnalyticsJobs.addCommunicationTrackingJob({
        userId: data.userId,
        sessionId: data.sessionId || `sms_${Date.now()}`,
        communicationType: CommunicationType.SMS,
        communicationStatus: data.status,
        recipientPhone: data.recipientPhone,
        messageTemplate: data.messageTemplate,
        messageContent: data.messageContent,
        providerId: data.providerId,
        salonId: data.salonId,
        bookingId: data.bookingId,
        metadata: data.metadata
      });
    } catch (error) {
      console.error('Failed to queue SMS tracking:', error);
    }
  }

  /**
   * Track Email communication (non-blocking)
   */
  static async trackEmail(data: {
    userId?: string;
    sessionId?: string;
    recipientEmail: string;
    messageTemplate: MessageTemplate;
    messageContent?: string;
    status: CommunicationStatus;
    providerId?: string;
    salonId?: string;
    bookingId?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await AnalyticsJobs.addCommunicationTrackingJob({
        userId: data.userId,
        sessionId: data.sessionId || `email_${Date.now()}`,
        communicationType: CommunicationType.EMAIL,
        communicationStatus: data.status,
        recipientEmail: data.recipientEmail,
        messageTemplate: data.messageTemplate,
        messageContent: data.messageContent,
        providerId: data.providerId,
        salonId: data.salonId,
        bookingId: data.bookingId,
        metadata: data.metadata
      });
    } catch (error) {
      console.error('Failed to queue email tracking:', error);
    }
  }

  /**
   * Track WhatsApp communication (non-blocking)
   */
  static async trackWhatsApp(data: {
    userId?: string;
    sessionId?: string;
    recipientPhone: string;
    messageTemplate: MessageTemplate;
    messageContent?: string;
    status: CommunicationStatus;
    providerId?: string;
    salonId?: string;
    bookingId?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await AnalyticsJobs.addCommunicationTrackingJob({
        userId: data.userId,
        sessionId: data.sessionId || `whatsapp_${Date.now()}`,
        communicationType: CommunicationType.WHATSAPP,
        communicationStatus: data.status,
        recipientPhone: data.recipientPhone,
        messageTemplate: data.messageTemplate,
        messageContent: data.messageContent,
        providerId: data.providerId,
        salonId: data.salonId,
        bookingId: data.bookingId,
        metadata: data.metadata
      });
    } catch (error) {
      console.error('Failed to queue WhatsApp tracking:', error);
    }
  }

  /**
   * Update communication status (non-blocking)
   */
  static async updateCommunicationStatus(
    eventId: string,
    status: CommunicationStatus,
    timestamp?: Date
  ): Promise<void> {
    try {
      await AnalyticsJobs.addCommunicationStatusUpdateJob({
        eventId,
        status: status as any,
        timestamp
      });
    } catch (error) {
      console.error('Failed to queue communication status update:', error);
    }
  }

  /**
   * Get queue statistics (for monitoring)
   */
  static async getQueueStats(): Promise<any> {
    try {
      return await AnalyticsJobs.getQueueStats();
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return null;
    }
  }
}

// Export singleton instance for convenience
export const asyncAnalytics = AsyncAnalyticsService;
