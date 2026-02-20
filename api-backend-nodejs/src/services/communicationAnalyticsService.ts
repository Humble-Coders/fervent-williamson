import { PrismaClient, AnalyticsEventType } from '@prisma/client';

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
  providerResponse?: any;
  salonId?: string;
  bookingId?: string;
  serviceId?: string;
  metadata?: any;
}

export class CommunicationAnalyticsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Track SMS communication
   */
  async trackSMS(data: {
    userId?: string;
    sessionId?: string;
    recipientPhone: string;
    messageTemplate: MessageTemplate;
    messageContent?: string;
    status: CommunicationStatus;
    providerId?: string;
    providerResponse?: any;
    salonId?: string;
    bookingId?: string;
    metadata?: any;
  }) {
    try {
      await this.prisma.communicationAnalytics.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId || `sms_${Date.now()}`,
          communicationType: CommunicationType.SMS,
          communicationStatus: data.status,
          recipientPhone: data.recipientPhone,
          messageTemplate: data.messageTemplate,
          salonId: data.salonId,
          bookingId: data.bookingId,
          metadata: {
            ...data.metadata,
            messageContent: data.messageContent,
            providerId: data.providerId,
            providerResponse: data.providerResponse
          }
        }
      });

      console.log('SMS communication tracked', {
        phone: data.recipientPhone,
        template: data.messageTemplate,
        status: data.status
      });
    } catch (error) {
      console.error('Failed to track SMS communication', error);
    }
  }

  /**
   * Track Email communication
   */
  async trackEmail(data: {
    userId?: string;
    sessionId?: string;
    recipientEmail: string;
    messageTemplate: MessageTemplate;
    messageContent?: string;
    status: CommunicationStatus;
    providerId?: string;
    providerResponse?: any;
    salonId?: string;
    bookingId?: string;
    metadata?: any;
  }) {
    try {
      await this.prisma.communicationAnalytics.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId || `email_${Date.now()}`,
          communicationType: CommunicationType.EMAIL,
          communicationStatus: data.status,
          recipientEmail: data.recipientEmail,
          messageTemplate: data.messageTemplate,
          salonId: data.salonId,
          bookingId: data.bookingId,
          metadata: {
            ...data.metadata,
            messageContent: data.messageContent,
            providerId: data.providerId,
            providerResponse: data.providerResponse
          }
        }
      });

      console.log('Email communication tracked', {
        email: data.recipientEmail,
        template: data.messageTemplate,
        status: data.status
      });
    } catch (error) {
      console.error('Failed to track email communication', error);
    }
  }

  /**
   * Track WhatsApp communication
   */
  async trackWhatsApp(data: {
    userId?: string;
    sessionId?: string;
    recipientPhone: string;
    messageTemplate: MessageTemplate;
    messageContent?: string;
    status: CommunicationStatus;
    providerId?: string;
    providerResponse?: any;
    salonId?: string;
    bookingId?: string;
    metadata?: any;
  }) {
    try {
      await this.prisma.communicationAnalytics.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId || `whatsapp_${Date.now()}`,
          communicationType: CommunicationType.WHATSAPP,
          communicationStatus: data.status,
          recipientPhone: data.recipientPhone,
          messageTemplate: data.messageTemplate,
          salonId: data.salonId,
          bookingId: data.bookingId,
          metadata: {
            ...data.metadata,
            messageContent: data.messageContent,
            providerId: data.providerId,
            providerResponse: data.providerResponse
          }
        }
      });

      console.log('WhatsApp communication tracked', {
        phone: data.recipientPhone,
        template: data.messageTemplate,
        status: data.status
      });
    } catch (error) {
      console.error('Failed to track WhatsApp communication', error);
    }
  }

  /**
   * Track Push Notification
   */
  async trackPushNotification(data: {
    userId?: string;
    sessionId?: string;
    messageTemplate: MessageTemplate;
    messageContent?: string;
    status: CommunicationStatus;
    providerId?: string;
    providerResponse?: any;
    salonId?: string;
    bookingId?: string;
    metadata?: any;
  }) {
    try {
      await this.prisma.communicationAnalytics.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId || `push_${Date.now()}`,
          communicationType: CommunicationType.PUSH,
          communicationStatus: data.status,
          messageTemplate: data.messageTemplate,
          salonId: data.salonId,
          bookingId: data.bookingId,
          metadata: {
            ...data.metadata,
            messageContent: data.messageContent,
            providerId: data.providerId,
            providerResponse: data.providerResponse
          }
        }
      });

      console.log('Push notification tracked', {
        template: data.messageTemplate,
        status: data.status
      });
    } catch (error) {
      console.error('Failed to track push notification', error);
    }
  }

  /**
   * Track In-App Notification
   */
  async trackInAppNotification(data: {
    userId?: string;
    sessionId?: string;
    messageTemplate: MessageTemplate;
    messageContent?: string;
    status: CommunicationStatus;
    salonId?: string;
    bookingId?: string;
    metadata?: any;
  }) {
    try {
      await this.prisma.communicationAnalytics.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId || `inapp_${Date.now()}`,
          communicationType: CommunicationType.IN_APP,
          communicationStatus: data.status,
          messageTemplate: data.messageTemplate,
          salonId: data.salonId,
          bookingId: data.bookingId,
          metadata: {
            ...data.metadata,
            messageContent: data.messageContent
          }
        }
      });

      console.log('In-app notification tracked', {
        template: data.messageTemplate,
        status: data.status
      });
    } catch (error) {
      console.error('Failed to track in-app notification', error);
    }
  }

  /**
   * Update communication status (for delivery confirmations, opens, clicks)
   */
  async updateCommunicationStatus(
    eventId: string,
    status: CommunicationStatus,
    timestamp?: Date
  ) {
    try {
      const updateData: any = {
        communicationStatus: status
      };

      if (status === CommunicationStatus.DELIVERED && timestamp) {
        updateData.deliveryTime = timestamp;
      } else if (status === CommunicationStatus.OPENED && timestamp) {
        updateData.openedAt = timestamp;
      } else if (status === CommunicationStatus.CLICKED && timestamp) {
        updateData.clickedAt = timestamp;
      }

      await this.prisma.analyticsEvent.update({
        where: { id: eventId },
        data: updateData
      });

      console.log('Communication status updated', {
        eventId,
        status,
        timestamp
      });
    } catch (error) {
      console.error('Failed to update communication status', error);
    }
  }
}

// Export singleton instance
export const communicationAnalytics = new CommunicationAnalyticsService();
