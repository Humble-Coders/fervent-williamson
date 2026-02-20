/**
 * Booking Notification Jobs
 * Job processors for booking-related notifications
 */

import Bull = require('bull');
import { queueManager } from '../QueueManager';
import { BookingNotificationTemplates } from '../../templates/BookingNotificationTemplates';
import { env, isDevelopment } from '../../config/env';
import { prisma } from '../../config/database';
import { getNotificationSMSServiceConfig } from '../../services/notificationProviderService';
import { SMSServiceFactory } from '../../services/sms/SMSServiceFactory';

// Job data interfaces
export interface BookingCreatedJobData {
  bookingId: string;
  userId: string;
  salonId: string;
  customerEmail: string;
  customerPhone?: string;
  customerName: string;
  salonOwnerEmail: string;
  salonOwnerPhone?: string;
  salonName: string;
  serviceName: string;
  stylistName?: string;
  bookingDate: string;
  bookingTime: string;
  duration: number;
  totalPrice: number;
  verificationCode: string;
  salonAddress: string;
}

export interface BookingConfirmedJobData {
  bookingId: string;
  customerEmail: string;
  customerPhone?: string;
  customerName: string;
  salonName: string;
  salonAddress: string;
  serviceName: string;
  stylistName?: string;
  bookingDate: string;
  bookingTime: string;
  duration: number;
  totalPrice: number;
  userCode: string;
}



// Helper function to get system configuration value
async function getSystemConfigValue(key: string, defaultValue: string = 'false'): Promise<string> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key }
    });
    return config?.value || defaultValue;
  } catch (error) {
    console.error(`Error fetching system config for key ${key}:`, error);
    return defaultValue;
  }
}

// Helper function to check if a boolean config is enabled
async function isConfigEnabled(key: string, defaultValue: boolean = false): Promise<boolean> {
  const value = await getSystemConfigValue(key, defaultValue.toString());
  return value === 'true';
}

export class BookingNotificationJobs {
  private static readonly QUEUE_NAME = 'booking-notifications';
  
  /**
   * Initialize job processors
   */
  public static init(): void {
    // Process booking created notifications
    queueManager.processJobs(
      this.QUEUE_NAME,
      'booking-created',
      this.processBookingCreated.bind(this),
      2 // Process 2 jobs concurrently
    );

    // Process booking confirmed notifications
    queueManager.processJobs(
      this.QUEUE_NAME,
      'booking-confirmed',
      this.processBookingConfirmed.bind(this),
      2 // Process 2 jobs concurrently
    );

    console.log('📋 Booking notification job processors initialized');
  }

  /**
   * Add booking created notification job
   */
  public static async addBookingCreatedJob(data: BookingCreatedJobData): Promise<Bull.Job> {
    return queueManager.addJob(
      this.QUEUE_NAME,
      'booking-created',
      data,
      {
        attempts: 3,
        delay: 1000, // 1 second delay
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );
  }

  /**
   * Add booking confirmed notification job
   */
  public static async addBookingConfirmedJob(data: BookingConfirmedJobData): Promise<Bull.Job> {
    return queueManager.addJob(
      this.QUEUE_NAME,
      'booking-confirmed',
      data,
      {
        attempts: 3,
        delay: 1000, // 1 second delay
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );
  }



  /**
   * Process booking created notifications
   */
  private static async processBookingCreated(job: Bull.Job<BookingCreatedJobData>): Promise<void> {
    const data = job.data;

    try {
      console.log(`📧 Processing booking created notifications for booking ${data.bookingId}`);
      console.log(`📧 Notification data:`, {
        bookingId: data.bookingId,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        salonOwnerEmail: data.salonOwnerEmail,
        salonOwnerPhone: data.salonOwnerPhone,
        salonName: data.salonName,
        serviceName: data.serviceName
      });



      // Update job progress
      await job.progress(10);

      // Send notifications to customer
      await this.sendCustomerBookingCreatedNotifications(data);
      await job.progress(50);

      // Send notifications to salon owner
      await this.sendSalonOwnerBookingCreatedNotifications(data);
      await job.progress(100);

      console.log(`✅ Booking created notifications sent for booking ${data.bookingId}`);
    } catch (error) {
      console.error(`❌ Failed to send booking created notifications for booking ${data.bookingId}:`, error);
      console.error(`❌ Error details:`, error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  /**
   * Process booking confirmed notification job
   */
  private static async processBookingConfirmed(job: Bull.Job<BookingConfirmedJobData>): Promise<void> {
    const data = job.data;
    console.log(`📧 Processing booking confirmed notifications for booking ${data.bookingId}`);

    try {
      console.log(`📧 Notification data:`, {
        bookingId: data.bookingId,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        salonName: data.salonName,
        serviceName: data.serviceName,
        userCode: data.userCode
      });

      // Update job progress
      await job.progress(10);

      // Send notifications to customer only (salon owner doesn't need confirmation notification)
      await this.sendCustomerBookingConfirmedNotifications(data);
      await job.progress(100);

      console.log(`✅ Booking confirmed notifications sent for booking ${data.bookingId}`);
    } catch (error) {
      console.error(`❌ Failed to send booking confirmed notifications for booking ${data.bookingId}:`, error);
      console.error(`❌ Error details:`, error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  /**
   * Send customer notifications for booking created
   */
  private static async sendCustomerBookingCreatedNotifications(data: BookingCreatedJobData): Promise<void> {
    const promises: Promise<any>[] = [];

    // Check if order placed email notifications are enabled
    const emailEnabled = await isConfigEnabled('order_placed_email_enabled', true);
    if (data.customerEmail && emailEnabled) {
      console.log(`📧 Order placed email notifications enabled - sending to customer`);
      promises.push(this.sendCustomerBookingCreatedEmail(data));
    } else if (data.customerEmail && !emailEnabled) {
      console.log(`📧 Order placed email notifications disabled - skipping customer email`);
    }

    // Check if order placed SMS notifications are enabled
    const smsEnabled = await isConfigEnabled('order_placed_sms_enabled', false);
    if (data.customerPhone && smsEnabled) {
      console.log(`📱 Order placed SMS notifications enabled - sending to customer`);
      promises.push(this.sendCustomerBookingCreatedSMS(data));
    } else if (data.customerPhone && !smsEnabled) {
      console.log(`📱 Order placed SMS notifications disabled - skipping customer SMS`);
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send salon owner notifications for booking created
   */
  private static async sendSalonOwnerBookingCreatedNotifications(data: BookingCreatedJobData): Promise<void> {
    const promises: Promise<any>[] = [];

    // Check if order placed email notifications are enabled
    const emailEnabled = await isConfigEnabled('order_placed_email_enabled', true);
    if (data.salonOwnerEmail && emailEnabled) {
      console.log(`📧 Order placed email notifications enabled - sending to salon owner`);
      promises.push(this.sendSalonOwnerBookingCreatedEmail(data));
    } else if (data.salonOwnerEmail && !emailEnabled) {
      console.log(`📧 Order placed email notifications disabled - skipping salon owner email`);
    }

    // Check if order placed SMS notifications are enabled
    const smsEnabled = await isConfigEnabled('order_placed_sms_enabled', false);
    if (data.salonOwnerPhone && smsEnabled) {
      console.log(`📱 Order placed SMS notifications enabled - sending to salon owner`);
      promises.push(this.sendSalonOwnerBookingCreatedSMS(data));
    } else if (data.salonOwnerPhone && !smsEnabled) {
      console.log(`📱 Order placed SMS notifications disabled - skipping salon owner SMS`);
    }

    await Promise.allSettled(promises);
  }



  /**
   * Send customer booking created email
   */
  private static async sendCustomerBookingCreatedEmail(data: BookingCreatedJobData): Promise<void> {
    console.log(`📧 [EMAIL] Starting customer booking created email for booking ${data.bookingId}`);
    console.log(`📧 [EMAIL] Recipient: ${data.customerEmail}`);

    try {
      // Check if SMTP is configured
      if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
        console.log('⚠️ [EMAIL] SMTP not configured - skipping email notification');
        return;
      }

      console.log(`📧 [EMAIL] SMTP Config: Host=${env.SMTP_HOST}, Port=${env.SMTP_PORT}, User=${env.SMTP_USER}`);

      // Use nodemailer directly to avoid dependency injection issues
      const nodemailer = await import('nodemailer');

      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: false,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });

      console.log(`📧 [EMAIL] SMTP transporter created successfully`);

      const template = BookingNotificationTemplates.getCustomerBookingCreatedEmailTemplate(data);
      console.log(`📧 [EMAIL] Template generated - Subject: ${template.subject}`);

      const mailOptions = {
        from: `${env.SMTP_FROM_NAME || 'CutQ'} <${env.SMTP_FROM_EMAIL}>`,
        to: data.customerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      const result = await transporter.sendMail(mailOptions);

      console.log(`✅ [EMAIL] Customer booking created email sent successfully to ${data.customerEmail}`);
      console.log(`✅ [EMAIL] Email result:`, { messageId: result.messageId, response: result.response });

    } catch (error) {
      console.error('❌ [EMAIL] Error sending customer booking created email:', error);
      console.error('❌ [EMAIL] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      // Don't throw - let the job complete even if email fails
    }
  }

  /**
   * Send customer booking created SMS
   */
  private static async sendCustomerBookingCreatedSMS(data: BookingCreatedJobData): Promise<void> {
    console.log(`📱 [SMS] Starting customer booking created SMS for booking ${data.bookingId}`);
    console.log(`📱 [SMS] Recipient: ${data.customerPhone}`);

    try {
      // Get SMS service configuration from admin settings
      const smsConfig = await getNotificationSMSServiceConfig();
      console.log(`📱 [SMS] Using SMS provider: ${smsConfig.provider}`);

      const message = await BookingNotificationTemplates.getCustomerBookingCreatedSMSTemplate(data);
      console.log(`📱 [SMS] Message generated: ${message.substring(0, 100)}...`);

      // Use SMS service factory to send SMS
      const smsService = SMSServiceFactory.create(smsConfig);
      const result = await smsService.sendSMS({
        to: data.customerPhone!,
        message: message
      });

      if (result.success) {
        console.log(`✅ [SMS] Customer booking created SMS sent successfully to ${data.customerPhone}`);
        console.log(`✅ [SMS] Message ID: ${result.data?.messageId}`);
      } else {
        console.error(`❌ [SMS] Failed to send customer booking created SMS: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ [SMS] Error sending customer booking created SMS:', error);
      console.error('❌ [SMS] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  /**
   * Send salon owner booking created email
   */
  private static async sendSalonOwnerBookingCreatedEmail(data: BookingCreatedJobData): Promise<void> {
    console.log(`📧 [OWNER-EMAIL] Starting salon owner booking created email for booking ${data.bookingId}`);
    console.log(`📧 [OWNER-EMAIL] Recipient: ${data.salonOwnerEmail}`);
    console.log(`📧 [OWNER-EMAIL] Salon: ${data.salonName}`);

    try {
      // Check if SMTP is configured
      if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
        console.log('⚠️ [OWNER-EMAIL] SMTP not configured - skipping email notification');
        return;
      }

      // Use nodemailer directly to avoid dependency injection issues
      const nodemailer = await import('nodemailer');

      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: false,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });

      console.log(`📧 [OWNER-EMAIL] SMTP transporter created successfully`);

      const template = BookingNotificationTemplates.getSalonOwnerBookingCreatedEmailTemplate(data);
      console.log(`📧 [OWNER-EMAIL] Template generated - Subject: ${template.subject}`);

      const mailOptions = {
        from: `${env.SMTP_FROM_NAME || 'CutQ'} <${env.SMTP_FROM_EMAIL}>`,
        to: data.salonOwnerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      const result = await transporter.sendMail(mailOptions);

      console.log(`✅ [OWNER-EMAIL] Salon owner booking created email sent successfully to ${data.salonOwnerEmail}`);
      console.log(`✅ [OWNER-EMAIL] Email result:`, { messageId: result.messageId, response: result.response });

    } catch (error) {
      console.error('❌ [OWNER-EMAIL] Error sending salon owner booking created email:', error);
      console.error('❌ [OWNER-EMAIL] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      // Don't throw - let the job complete even if email fails
    }
  }

  /**
   * Send salon owner booking created SMS
   */
  private static async sendSalonOwnerBookingCreatedSMS(data: BookingCreatedJobData): Promise<void> {
    console.log(`📱 [OWNER-SMS] Starting salon owner booking created SMS for booking ${data.bookingId}`);
    console.log(`📱 [OWNER-SMS] Recipient: ${data.salonOwnerPhone}`);
    console.log(`📱 [OWNER-SMS] Salon: ${data.salonName}`);

    try {
      // Get SMS service configuration from admin settings
      const smsConfig = await getNotificationSMSServiceConfig();
      console.log(`📱 [OWNER-SMS] Using SMS provider: ${smsConfig.provider}`);

      const message = await BookingNotificationTemplates.getSalonOwnerBookingCreatedSMSTemplate(data);
      console.log(`📱 [OWNER-SMS] Message generated: ${message.substring(0, 100)}...`);

      // Use SMS service factory to send SMS
      const smsService = SMSServiceFactory.create(smsConfig);
      const result = await smsService.sendSMS({
        to: data.salonOwnerPhone!,
        message: message
      });

      if (result.success) {
        console.log(`✅ [OWNER-SMS] Salon owner booking created SMS sent successfully to ${data.salonOwnerPhone}`);
        console.log(`✅ [OWNER-SMS] Message ID: ${result.data?.messageId}`);
      } else {
        console.error(`❌ [OWNER-SMS] Failed to send salon owner booking created SMS: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ [OWNER-SMS] Error sending salon owner booking created SMS:', error);
      console.error('❌ [OWNER-SMS] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  /**
   * Send customer notifications for booking confirmed
   */
  private static async sendCustomerBookingConfirmedNotifications(data: BookingConfirmedJobData): Promise<void> {
    const promises: Promise<any>[] = [];

    // Check if order confirmed email notifications are enabled
    const emailEnabled = await isConfigEnabled('order_confirmed_email_enabled', true);
    if (emailEnabled) {
      console.log(`📧 Order confirmed email notifications enabled - sending to customer`);
      promises.push(this.sendCustomerBookingConfirmedEmail(data));
    } else {
      console.log(`📧 Order confirmed email notifications disabled - skipping customer email`);
    }

    // Check if order confirmed SMS notifications are enabled
    const smsEnabled = await isConfigEnabled('order_confirmed_sms_enabled', false);
    if (data.customerPhone && smsEnabled) {
      console.log(`📱 Order confirmed SMS notifications enabled - sending to customer`);
      promises.push(this.sendCustomerBookingConfirmedSMS(data));
    } else if (data.customerPhone && !smsEnabled) {
      console.log(`📱 Order confirmed SMS notifications disabled - skipping customer SMS`);
    }

    // Wait for all notifications to complete
    await Promise.allSettled(promises);
  }

  /**
   * Send customer booking confirmed email
   */
  private static async sendCustomerBookingConfirmedEmail(data: BookingConfirmedJobData): Promise<void> {
    console.log(`📧 [CONFIRMED-EMAIL] Starting customer booking confirmed email for booking ${data.bookingId}`);
    console.log(`📧 [CONFIRMED-EMAIL] Recipient: ${data.customerEmail}`);

    try {
      if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
        console.error('❌ [CONFIRMED-EMAIL] SMTP configuration incomplete');
        return;
      }

      console.log(`📧 [CONFIRMED-EMAIL] SMTP Config: Host=${env.SMTP_HOST}, Port=${env.SMTP_PORT}, User=${env.SMTP_USER}`);

      const nodemailer = require('nodemailer');

      // Create SMTP transporter
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE === 'true',
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });

      console.log(`📧 [CONFIRMED-EMAIL] SMTP transporter created successfully`);

      // Generate email template
      const template = BookingNotificationTemplates.getCustomerBookingConfirmedEmailTemplate(data);
      console.log(`📧 [CONFIRMED-EMAIL] Template generated - Subject: ${template.subject}`);

      // Send email
      const result = await transporter.sendMail({
        from: env.SMTP_FROM_EMAIL || env.SMTP_USER,
        to: data.customerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`✅ [CONFIRMED-EMAIL] Customer booking confirmed email sent successfully to ${data.customerEmail}`);
      console.log(`✅ [CONFIRMED-EMAIL] Email result:`, {
        messageId: result.messageId,
        response: result.response
      });
    } catch (error) {
      console.error('❌ [CONFIRMED-EMAIL] Error sending customer booking confirmed email:', error);
      console.error('❌ [CONFIRMED-EMAIL] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      // Don't throw - let the job complete even if email fails
    }
  }

  /**
   * Send customer booking confirmed SMS
   */
  private static async sendCustomerBookingConfirmedSMS(data: BookingConfirmedJobData): Promise<void> {
    console.log(`📱 [CONFIRMED-SMS] Starting customer booking confirmed SMS for booking ${data.bookingId}`);
    console.log(`📱 [CONFIRMED-SMS] Recipient: ${data.customerPhone}`);

    try {
      // Get SMS service configuration from admin settings
      const smsConfig = await getNotificationSMSServiceConfig();
      console.log(`📱 [CONFIRMED-SMS] Using SMS provider: ${smsConfig.provider}`);

      const message = await BookingNotificationTemplates.getCustomerBookingConfirmedSMSTemplate(data);
      console.log(`📱 [CONFIRMED-SMS] Message generated: ${message.substring(0, 100)}...`);

      // Use SMS service factory to send SMS
      const smsService = SMSServiceFactory.create(smsConfig);
      const result = await smsService.sendSMS({
        to: data.customerPhone!,
        message: message
      });

      if (result.success) {
        console.log(`✅ [CONFIRMED-SMS] Customer booking confirmed SMS sent successfully to ${data.customerPhone}`);
        console.log(`✅ [CONFIRMED-SMS] Message ID: ${result.data?.messageId}`);
      } else {
        console.error(`❌ [CONFIRMED-SMS] Failed to send customer booking confirmed SMS: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ [CONFIRMED-SMS] Error sending customer booking confirmed SMS:', error);
      console.error('❌ [CONFIRMED-SMS] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

}
