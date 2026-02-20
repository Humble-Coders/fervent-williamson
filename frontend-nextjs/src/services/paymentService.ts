/**
 * Payment Service
 * Handles Razorpay payment integration
 */

import { api } from './api';
import { extractErrorMessage } from '../utils/errorHandler';
import { env } from '../config/env';

// Razorpay types
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface CreateOrderResponse {
  success: boolean;
  data: {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    booking: {
      id: string;
      serviceName: string;
      salonName: string;
      totalPrice: number;
    };
    payment: {
      id: string;
      status: string;
    };
  };
  message: string;
}

interface VerifyPaymentResponse {
  success: boolean;
  data: {
    booking: any;
    payment: any;
  };
  message: string;
}

interface PaymentDetailsResponse {
  success: boolean;
  data: any;
  message: string;
}

// Declare Razorpay global
declare global {
  interface Window {
    Razorpay: any;
  }
}

export class PaymentService {
  private isRazorpayLoaded = false;

  /**
   * Load Razorpay script
   */
  private async loadRazorpayScript(): Promise<boolean> {
    if (this.isRazorpayLoaded) {
      return true;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.isRazorpayLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Create payment order
   */
  async createOrder(bookingId: string): Promise<CreateOrderResponse['data']> {
    try {
      const response = await api.post<CreateOrderResponse>('/payments/create-order', {
        bookingId,
      });
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(paymentData: RazorpayResponse): Promise<VerifyPaymentResponse['data']> {
    try {
      const response = await api.post<VerifyPaymentResponse>('/payments/verify', paymentData);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Get payment details for a booking
   */
  async getPaymentDetails(bookingId: string): Promise<any> {
    try {
      const response = await api.get<PaymentDetailsResponse>(`/payments/booking/${bookingId}`);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Process payment using Razorpay
   */
  async processPayment(
    bookingId: string,
    userDetails: {
      name: string;
      email: string;
      phone: string;
    }
  ): Promise<{ success: boolean; booking?: any; error?: string }> {
    try {
      // Load Razorpay script
      const isLoaded = await this.loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      // Create order
      const orderData = await this.createOrder(bookingId);

      return new Promise((resolve) => {
        const options: RazorpayOptions = {
          key: env.RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: env.BRAND_NAME,
          description: `Payment for ${orderData.booking.serviceName} at ${orderData.booking.salonName}`,
          order_id: orderData.orderId,
          handler: async (response: RazorpayResponse) => {
            try {
              // Verify payment
              const verificationResult = await this.verifyPayment(response);
              resolve({
                success: true,
                booking: verificationResult.booking,
              });
            } catch (error) {
              resolve({
                success: false,
                error: extractErrorMessage(error),
              });
            }
          },
          prefill: {
            name: userDetails.name,
            email: userDetails.email,
            contact: userDetails.phone,
          },
          theme: {
            color: '#3B82F6', // Primary blue color
          },
          modal: {
            ondismiss: () => {
              resolve({
                success: false,
                error: 'Payment cancelled by user',
              });
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      });
    } catch (error) {
      return {
        success: false,
        error: extractErrorMessage(error),
      };
    }
  }

  /**
   * Check if payment is required for booking
   */
  isPaymentRequired(): boolean {
    // This could be fetched from system config in the future
    return true;
  }
}

export const paymentService = new PaymentService();
