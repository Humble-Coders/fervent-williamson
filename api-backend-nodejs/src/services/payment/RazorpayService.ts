/**
 * Razorpay Payment Service
 * Handles payment processing, order creation, and webhook verification
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../../config/env';
import { prisma } from '../../config/database';


// Razorpay types
interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
}

interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method: string;
  captured: boolean;
  description: string;
  email: string;
  contact: string;
  created_at: number;
}

interface CreateOrderData {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

interface VerifyPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }

  /**
   * Create a Razorpay order
   */
  async createOrder(data: CreateOrderData): Promise<RazorpayOrder> {
    try {
      const options = {
        amount: data.amount * 100, // Convert to paise
        currency: data.currency || 'INR',
        receipt: data.receipt,
        notes: data.notes || {},
      };

      const order = await this.razorpay.orders.create(options);
      return order as RazorpayOrder;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(data: VerifyPaymentData): boolean {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
      
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === razorpay_signature;
    } catch (error) {
      console.error('Error verifying payment signature:', error);
      return false;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      if (!env.RAZORPAY_WEBHOOK_SECRET) {
        console.warn('Razorpay webhook secret not configured');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Get payment details from Razorpay
   */
  async getPayment(paymentId: string): Promise<RazorpayPayment> {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment as RazorpayPayment;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw new Error('Failed to fetch payment details');
    }
  }

  /**
   * Get order details from Razorpay
   */
  async getOrder(orderId: string): Promise<RazorpayOrder> {
    try {
      const order = await this.razorpay.orders.fetch(orderId);
      return order as RazorpayOrder;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw new Error('Failed to fetch order details');
    }
  }

  /**
   * Create payment record in database
   */
  async createPaymentRecord(bookingId: string, orderData: RazorpayOrder) {
    try {
      const payment = await prisma.payment.create({
        data: {
          bookingId,
          amount: orderData.amount / 100, // Convert from paise to rupees
          method: 'razorpay',
          status: 'PENDING',
          currency: orderData.currency,
          razorpayOrderId: orderData.id,
        },
      });

      return payment;
    } catch (error) {
      console.error('Error creating payment record:', error);
      throw new Error('Failed to create payment record');
    }
  }

  /**
   * Update payment record after successful payment
   */
  async updatePaymentRecord(
    orderId: string,
    paymentData: RazorpayPayment,
    signature: string
  ) {
    try {
      // First find the payment
      const existingPayment = await prisma.payment.findFirst({
        where: {
          razorpayOrderId: orderId,
        },
        include: {
          booking: true,
        },
      });

      if (!existingPayment) {
        throw new Error('Payment not found');
      }

      // Then update it
      const payment = await prisma.payment.update({
        where: {
          id: existingPayment.id,
        },
        data: {
          status: 'PAID',
          razorpayPaymentId: paymentData.id,
          razorpaySignature: signature,
          paidAt: new Date(),
        },
        include: {
          booking: true,
        },
      });

      return payment;
    } catch (error) {
      console.error('Error updating payment record:', error);
      throw new Error('Failed to update payment record');
    }
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(orderId: string, reason: string) {
    try {
      // First find the payment
      const existingPayment = await prisma.payment.findFirst({
        where: {
          razorpayOrderId: orderId,
        },
      });

      if (!existingPayment) {
        throw new Error('Payment not found');
      }

      // Then update it
      const payment = await prisma.payment.update({
        where: {
          id: existingPayment.id,
        },
        data: {
          status: 'FAILED',
          failureReason: reason,
        },
        include: {
          booking: true,
        },
      });

      return payment;
    } catch (error) {
      console.error('Error handling payment failure:', error);
      throw new Error('Failed to handle payment failure');
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, amount?: number) {
    try {
      const refundData: any = {
        payment_id: paymentId,
      };

      if (amount) {
        refundData.amount = amount * 100; // Convert to paise
      }

      const refund = await this.razorpay.payments.refund(paymentId, refundData);
      return refund;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Check if payment is required for booking
   */
  isPaymentRequired(): boolean {
    return env.PAYMENT_REQUIRED_FOR_BOOKING;
  }

  /**
   * Get payment timeout in minutes
   */
  getPaymentTimeout(): number {
    return env.PAYMENT_TIMEOUT_MINUTES;
  }
}

export const razorpayService = new RazorpayService();
