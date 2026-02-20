/**
 * Booking Notification Templates
 * Email and SMS templates for booking notifications
 */

import { BookingCreatedJobData } from '../queues/jobs/BookingNotificationJobs';
import { prisma } from '../config/database';

// Helper function to get SMS template from system config
async function getSMSTemplate(templateKey: string): Promise<{ message: string; templateId?: string }> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: templateKey }
    });

    if (!config?.value) {
      throw new Error(`SMS template not found in database: ${templateKey}`);
    }

    try {
      // Try to parse as array (new format)
      const templates = JSON.parse(config.value);
      if (Array.isArray(templates) && templates.length > 0) {
        // Randomly select a template from the array
        const randomIndex = Math.floor(Math.random() * templates.length);
        const selectedTemplate = templates[randomIndex];

        // Handle both old string format and new object format
        if (typeof selectedTemplate === 'string') {
          return { message: selectedTemplate };
        } else if (typeof selectedTemplate === 'object' && selectedTemplate.message) {
          return {
            message: selectedTemplate.message,
            templateId: selectedTemplate.templateId
          };
        }
      }

      throw new Error(`Invalid template format for ${templateKey}`);
    } catch (parseError) {
      // If parsing fails, treat as string (legacy format)
      return { message: config.value };
    }
  } catch (error) {
    console.error(`Error fetching SMS template ${templateKey}:`, error);
    throw error;
  }
}

// Helper function to replace template variables
function replaceTemplateVariables(template: string, variables: string[]): string {
  let result = template;
  variables.forEach((variable, index) => {
    result = result.replace('{#var#}', variable);
  });
  return result;
}

export class BookingNotificationTemplates {
  
  /**
   * Customer booking created email template
   */
  public static getCustomerBookingCreatedEmailTemplate(data: BookingCreatedJobData) {
    const subject = `Booking Placed Successfully - ${data.salonName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Placed Successfully</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .verification-code { background: #667eea; color: white; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; font-size: 18px; font-weight: bold; letter-spacing: 2px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Placed Successfully!</h1>
            <p>Your appointment request has been received</p>
          </div>
          
          <div class="content">
            <p>Hi <strong>${data.customerName}</strong>,</p>
            
            <p>Thank you for choosing <strong>${data.salonName}</strong>! Your booking has been placed successfully and is awaiting salon confirmation.</p>
            
            <div class="booking-details">
              <h3>📋 Booking Details</h3>
              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${data.serviceName}</span>
              </div>
              ${data.stylistName ? `
              <div class="detail-row">
                <span class="detail-label">Stylist:</span>
                <span class="detail-value">${data.stylistName}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date(data.bookingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${data.bookingTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${data.duration} minutes</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Price:</span>
                <span class="detail-value">₹${data.totalPrice}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${data.salonAddress}</span>
              </div>
            </div>
            
            <div class="verification-code">
              <p style="margin: 0; font-size: 14px;">Your Verification Code</p>
              <p style="margin: 5px 0 0 0; font-size: 24px;">${data.verificationCode}</p>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>The salon owner will review and confirm your booking</li>
              <li>You'll receive another notification once confirmed</li>
              <li>Keep your verification code safe - you'll need it at the salon</li>
            </ul>
            
            <p>If you need to make any changes or have questions, please contact the salon directly.</p>
            
            <div class="footer">
              <p>Thank you for choosing CutQ!</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
      Booking Placed Successfully - ${data.salonName}

      Hi ${data.customerName},

      Your booking at ${data.salonName} has been placed successfully and is awaiting salon confirmation.
      
      Booking Details:
      - Service: ${data.serviceName}
      ${data.stylistName ? `- Stylist: ${data.stylistName}` : ''}
      - Date: ${new Date(data.bookingDate).toLocaleDateString()}
      - Time: ${data.bookingTime}
      - Duration: ${data.duration} minutes
      - Total Price: ₹${data.totalPrice}
      - Location: ${data.salonAddress}
      
      Your Verification Code: ${data.verificationCode}
      
      The salon owner will review and confirm your booking. You'll receive another notification once confirmed.
      
      Thank you for choosing CutQ!
    `;
    
    return { subject, html, text };
  }

  /**
   * Customer booking created SMS template
   */
  public static async getCustomerBookingCreatedSMSTemplate(data: BookingCreatedJobData): Promise<string> {
    const templateData = await getSMSTemplate('sms_template_booking_placed_customer');
    const template = templateData.message;

    const variables = [
      data.salonName,
      new Date(data.bookingDate).toLocaleDateString(),
      data.bookingTime,
      data.serviceName,
      data.verificationCode
    ];

    return replaceTemplateVariables(template, variables);
  }

  /**
   * Salon owner booking created email template
   */
  public static getSalonOwnerBookingCreatedEmailTemplate(data: BookingCreatedJobData) {
    const subject = `New Booking Request - ${data.customerName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Booking Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5576c; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .customer-info { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 New Booking Request</h1>
            <p>A customer has made a new booking</p>
          </div>
          
          <div class="content">
            <p>Hello,</p>
            
            <p>You have received a new booking request for <strong>${data.salonName}</strong>.</p>
            
            <div class="customer-info">
              <h3>👤 Customer Information</h3>
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${data.customerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${data.customerEmail}</span>
              </div>
              ${data.customerPhone ? `
              <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${data.customerPhone}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="booking-details">
              <h3>📋 Booking Details</h3>
              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${data.serviceName}</span>
              </div>
              ${data.stylistName ? `
              <div class="detail-row">
                <span class="detail-label">Stylist:</span>
                <span class="detail-value">${data.stylistName}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date(data.bookingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${data.bookingTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${data.duration} minutes</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Price:</span>
                <span class="detail-value">₹${data.totalPrice}</span>
              </div>
            </div>
            
            <p><strong>Action Required:</strong></p>
            <p>Please log in to your CutQ dashboard to review and confirm this booking. The customer is waiting for your approval.</p>
            
            <div class="footer">
              <p>CutQ Business Management Platform</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
      New Booking Request - ${data.customerName}
      
      You have received a new booking request for ${data.salonName}.
      
      Customer: ${data.customerName} (${data.customerEmail})
      Service: ${data.serviceName}
      ${data.stylistName ? `Stylist: ${data.stylistName}` : ''}
      Date: ${new Date(data.bookingDate).toLocaleDateString()}
      Time: ${data.bookingTime}
      Duration: ${data.duration} minutes
      Total Price: ₹${data.totalPrice}
      
      Please log in to your CutQ dashboard to review and confirm this booking.
      
      CutQ Business Management Platform
    `;
    
    return { subject, html, text };
  }

  /**
   * Salon owner booking created SMS template
   */
  public static async getSalonOwnerBookingCreatedSMSTemplate(data: BookingCreatedJobData): Promise<string> {
    const templateData = await getSMSTemplate('sms_template_booking_request_salon');
    const template = templateData.message;

    const variables = [
      data.customerName,
      data.serviceName,
      new Date(data.bookingDate).toLocaleDateString(),
      data.bookingTime
    ];

    return replaceTemplateVariables(template, variables);
  }

  /**
   * Customer booking confirmed email template
   */
  public static getCustomerBookingConfirmedEmailTemplate(data: any) {
    const subject = `Booking Confirmed - ${data.salonName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .user-code { background: #4CAF50; color: white; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; font-size: 18px; font-weight: bold; letter-spacing: 2px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .important-note { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Booking Confirmed!</h1>
            <p>Your appointment has been approved by the salon</p>
          </div>

          <div class="content">
            <p>Hi <strong>${data.customerName}</strong>,</p>

            <p>Excellent news! Your booking at <strong>${data.salonName}</strong> has been confirmed by the salon owner.</p>

            <div class="booking-details">
              <h3>📋 Confirmed Booking Details</h3>
              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${data.serviceName}</span>
              </div>
              ${data.stylistName ? `
              <div class="detail-row">
                <span class="detail-label">Stylist:</span>
                <span class="detail-value">${data.stylistName}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date(data.bookingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${data.bookingTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${data.duration} minutes</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Price:</span>
                <span class="detail-value">₹${data.totalPrice}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${data.salonAddress}</span>
              </div>
            </div>

            <div class="user-code">
              <p style="margin: 0; font-size: 14px;">Your Service Code</p>
              <p style="margin: 5px 0 0 0; font-size: 24px;">${data.userCode}</p>
            </div>

            <div class="important-note">
              <h4>📱 Important Instructions:</h4>
              <ul style="margin: 10px 0;">
                <li>Present your service code <strong>${data.userCode}</strong> when you arrive at the salon</li>
                <li>Arrive 5-10 minutes before your appointment time</li>
                <li>The salon will use this code to mark your service as complete</li>
              </ul>
            </div>

            <p>We're excited for your appointment! If you need to make any changes, please contact the salon directly.</p>

            <div class="footer">
              <p>Thank you for choosing CutQ!</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Booking Confirmed - ${data.salonName}

      Hi ${data.customerName},

      Your booking at ${data.salonName} has been confirmed by the salon owner.

      Confirmed Booking Details:
      - Service: ${data.serviceName}
      ${data.stylistName ? `- Stylist: ${data.stylistName}` : ''}
      - Date: ${new Date(data.bookingDate).toLocaleDateString()}
      - Time: ${data.bookingTime}
      - Duration: ${data.duration} minutes
      - Total Price: ₹${data.totalPrice}
      - Location: ${data.salonAddress}

      Your Service Code: ${data.userCode}

      Important: Present your service code ${data.userCode} when you arrive at the salon.

      Thank you for choosing CutQ!
    `;

    return { subject, html, text };
  }

  /**
   * Customer booking confirmed SMS template
   */
  public static async getCustomerBookingConfirmedSMSTemplate(data: any): Promise<string> {
    const templateData = await getSMSTemplate('sms_template_booking_confirmed_customer');
    const template = templateData.message;

    const variables = [
      data.salonName,
      new Date(data.bookingDate).toLocaleDateString(),
      data.bookingTime,
      data.serviceName,
      data.userCode
    ];

    return replaceTemplateVariables(template, variables);
  }

  /**
   * Salon owner booking confirmed email template
   */
  public static getSalonOwnerBookingConfirmedEmailTemplate(data: any) {
    const subject = `Booking Confirmed - ${data.customerName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .customer-info { background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .user-code { background: #4CAF50; color: white; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; font-size: 18px; font-weight: bold; letter-spacing: 2px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Booking Confirmed</h1>
            <p>You have successfully confirmed a booking</p>
          </div>

          <div class="content">
            <p>Hello,</p>

            <p>You have successfully confirmed the booking for <strong>${data.customerName}</strong> at <strong>${data.salonName}</strong>.</p>

            <div class="customer-info">
              <h3>👤 Customer Information</h3>
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${data.customerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${data.customerEmail}</span>
              </div>
              ${data.customerPhone ? `
              <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${data.customerPhone}</span>
              </div>
              ` : ''}
            </div>

            <div class="booking-details">
              <h3>📋 Confirmed Booking Details</h3>
              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${data.serviceName}</span>
              </div>
              ${data.stylistName ? `
              <div class="detail-row">
                <span class="detail-label">Stylist:</span>
                <span class="detail-value">${data.stylistName}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date(data.bookingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${data.bookingTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${data.duration} minutes</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Price:</span>
                <span class="detail-value">₹${data.totalPrice}</span>
              </div>
            </div>

            <div class="user-code">
              <p style="margin: 0; font-size: 14px;">Customer Service Code</p>
              <p style="margin: 5px 0 0 0; font-size: 24px;">${data.userCode}</p>
            </div>

            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>The customer has been notified of the confirmation</li>
              <li>They will present the service code <strong>${data.userCode}</strong> when they arrive</li>
              <li>Use this code to mark the service as complete in your dashboard</li>
            </ul>

            <div class="footer">
              <p>CutQ Business Management Platform</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Booking Confirmed - ${data.customerName}

      You have successfully confirmed the booking for ${data.customerName} at ${data.salonName}.

      Customer: ${data.customerName} (${data.customerEmail})
      Service: ${data.serviceName}
      ${data.stylistName ? `Stylist: ${data.stylistName}` : ''}
      Date: ${new Date(data.bookingDate).toLocaleDateString()}
      Time: ${data.bookingTime}
      Duration: ${data.duration} minutes
      Total Price: ₹${data.totalPrice}

      Customer Service Code: ${data.userCode}

      The customer will present this code when they arrive. Use it to mark the service as complete.

      CutQ Business Management Platform
    `;

    return { subject, html, text };
  }

  /**
   * Salon owner booking confirmed SMS template
   */
  public static getSalonOwnerBookingConfirmedSMSTemplate(data: any): string {
    return `CutQ: Booking confirmed for ${data.customerName} on ${new Date(data.bookingDate).toLocaleDateString()} at ${data.bookingTime}. Customer code: ${data.userCode}`;
  }
}
