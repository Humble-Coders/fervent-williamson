/**
 * Payment Routes
 * Handles payment creation, verification, and webhook processing
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { razorpayService } from '../services/payment/RazorpayService';
import { prisma } from '../config/database';

const router = express.Router();

// Validation schemas
const createPaymentOrderSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
});

/**
 * POST /api/v1/payments/create-order
 * Create a Razorpay order for booking payment
 */
router.post('/create-order', authenticate, async (req: Request, res: Response) => {
  try {
    const validatedData = createPaymentOrderSchema.parse(req.body);
    const userId = (req as any).user.id;

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        user: true,
        salon: true,
        service: true,
        payment: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify booking belongs to user
    if (booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to booking',
      });
    }

    // Check if booking is in correct status for payment
    if (booking.status !== 'PAYMENT_PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not in payment pending status',
      });
    }

    // Check if payment already exists
    if (booking.payment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already exists for this booking',
      });
    }

    // Create Razorpay order
    const orderData = await razorpayService.createOrder({
      amount: Number(booking.totalPrice),
      receipt: `booking_${booking.id}`,
      notes: {
        bookingId: booking.id,
        userId: booking.userId,
        salonId: booking.salonId,
        serviceId: booking.serviceId,
      },
    });

    // Create payment record in database
    const payment = await razorpayService.createPaymentRecord(booking.id, orderData);

    res.json({
      success: true,
      data: {
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        booking: {
          id: booking.id,
          serviceName: booking.service.name,
          salonName: booking.salon.name,
          totalPrice: booking.totalPrice,
        },
        payment: {
          id: payment.id,
          status: payment.status,
        },
      },
      message: 'Payment order created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error creating payment order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
    });
  }
});

/**
 * POST /api/v1/payments/verify
 * Verify payment and update booking status
 */
router.post('/verify', authenticate, async (req: Request, res: Response) => {
  try {
    const validatedData = verifyPaymentSchema.parse(req.body);
    const userId = (req as any).user.id;

    // Verify payment signature
    const isValidSignature = razorpayService.verifyPaymentSignature(validatedData);
    
    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // Get payment details from Razorpay
    const paymentDetails = await razorpayService.getPayment(validatedData.razorpay_payment_id);

    // Update payment record
    const payment = await razorpayService.updatePaymentRecord(
      validatedData.razorpay_order_id,
      paymentDetails,
      validatedData.razorpay_signature
    );

    // Update booking status to CONFIRMED
    const updatedBooking = await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'CONFIRMED' },
      include: {
        user: true,
        salon: true,
        service: true,
        stylist: true,
        payment: true,
      },
    });

    console.log(`✅ Payment verified and booking ${payment.bookingId} confirmed`);

    res.json({
      success: true,
      data: {
        booking: updatedBooking,
        payment: payment,
      },
      message: 'Payment verified successfully. Booking confirmed.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
    });
  }
});

/**
 * GET /api/v1/payments/booking/:bookingId
 * Get payment details for a booking
 */
router.get('/booking/:bookingId', authenticate, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).user.id;

    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            user: true,
            salon: true,
            service: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Verify payment belongs to user
    if (payment.booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to payment',
      });
    }

    res.json({
      success: true,
      data: payment,
      message: 'Payment details retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
    });
  }
});

/**
 * POST /api/v1/payments/webhook
 * Handle Razorpay webhooks
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = req.body.toString();

    // Verify webhook signature
    const isValidSignature = razorpayService.verifyWebhookSignature(body, signature);

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    const event = JSON.parse(body);
    console.log('📧 Received Razorpay webhook:', event.event);

    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
    });
  }
});

/**
 * Handle payment captured webhook
 */
async function handlePaymentCaptured(payment: any) {
  try {
    console.log(`💰 Payment captured: ${payment.id}`);

    // Update payment status if not already updated
    const existingPayment = await prisma.payment.findUnique({
      where: { razorpayPaymentId: payment.id },
      include: { booking: true },
    });

    if (existingPayment && existingPayment.status !== 'PAID') {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // Ensure booking is confirmed
      if (existingPayment.booking.status !== 'CONFIRMED') {
        await prisma.booking.update({
          where: { id: existingPayment.bookingId },
          data: { status: 'CONFIRMED' },
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

/**
 * Handle payment failed webhook
 */
async function handlePaymentFailed(payment: any) {
  try {
    console.log(`❌ Payment failed: ${payment.id}`);

    // Update payment status
    const existingPayment = await prisma.payment.findFirst({
      where: { razorpayOrderId: payment.order_id },
      include: { booking: true },
    });

    if (existingPayment) {
      await razorpayService.handlePaymentFailure(
        payment.order_id,
        payment.error_description || 'Payment failed'
      );
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

/**
 * Handle order paid webhook
 */
async function handleOrderPaid(order: any) {
  try {
    console.log(`✅ Order paid: ${order.id}`);
    // Additional order-level processing if needed
  } catch (error) {
    console.error('Error handling order paid:', error);
  }
}

export default router;
