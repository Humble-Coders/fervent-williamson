# Razorpay Payment Integration

This document provides comprehensive instructions for setting up and testing the Razorpay payment integration in the CutQ platform.

## Overview

The payment integration follows this flow:
1. User completes booking form
2. Booking is created with status `PAYMENT_PENDING`
3. Payment modal opens with Razorpay checkout
4. On successful payment, booking status changes to `CONFIRMED`
5. Webhook validates payment and ensures data consistency

## Environment Setup

### Backend Configuration

Add the following to your `.env` file:

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_RTM0m3NrKIg8Dt
RAZORPAY_KEY_SECRET=rzp_test_RTM0m3NrKIg8Dt
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Payment Configuration
PAYMENT_REQUIRED_FOR_BOOKING=true
PAYMENT_TIMEOUT_MINUTES=15
```

### Frontend Configuration

Add the following to your frontend `.env` file:

```bash
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_RTM0m3NrKIg8Dt
```

## Testing with ngrok

Since Razorpay webhooks require a public URL, you'll need to use ngrok for local testing.

### 1. Install ngrok

```bash
# Install ngrok (if not already installed)
npm install -g ngrok
# or
brew install ngrok
```

### 2. Start your backend server

```bash
cd api-backend-nodejs
npm run dev
```

### 3. Expose backend with ngrok

```bash
# In a new terminal
ngrok http 3002
```

This will give you a public URL like: `https://abc123.ngrok-free.app`

### 4. Update environment variables

Update your backend `.env` file with the ngrok URL:

```bash
# Add your ngrok URL
BACKEND_URL=https://abc123.ngrok-free.app
```

### 5. Configure Razorpay webhook

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to Settings > Webhooks
3. Create a new webhook with URL: `https://abc123.ngrok-free.app/api/v1/payments/webhook`
4. Select events: `payment.captured`, `payment.failed`, `order.paid`
5. Copy the webhook secret and update your `.env` file

## Test Payment Scenarios

### Test Card Numbers

Use these test card numbers for different scenarios:

**Successful Payments:**
- `4111 1111 1111 1111` (Visa)
- `5555 5555 5555 4444` (Mastercard)
- Any future expiry date, any CVV

**Failed Payments:**
- `4000 0000 0000 0002` (Card declined)
- `4000 0000 0000 0069` (Expired card)

### Test UPI IDs

- `success@razorpay` (Successful payment)
- `failure@razorpay` (Failed payment)

### Test Wallets

- Use any test wallet credentials provided by Razorpay

## API Endpoints

### Create Payment Order
```
POST /api/v1/payments/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "booking-uuid"
}
```

### Verify Payment
```
POST /api/v1/payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

### Get Payment Details
```
GET /api/v1/payments/booking/:bookingId
Authorization: Bearer <token>
```

### Webhook Endpoint
```
POST /api/v1/payments/webhook
Content-Type: application/json
X-Razorpay-Signature: <signature>

{
  "event": "payment.captured",
  "payload": { ... }
}
```

## Database Schema

The payment integration adds the following fields to the `Payment` model:

```prisma
model Payment {
  // ... existing fields
  razorpayOrderId   String?
  razorpayPaymentId String?
  razorpaySignature String?
  currency          String @default("INR")
  failureReason     String?
}
```

And adds `PAYMENT_PENDING` status to `BookingStatus` enum.

## Frontend Components

### PaymentModal
- Located at: `frontend-nextjs/src/components/payment/PaymentModal.tsx`
- Handles Razorpay checkout integration
- Shows booking summary and payment options

### PaymentService
- Located at: `frontend-nextjs/src/services/paymentService.ts`
- Manages payment API calls and Razorpay integration
- Handles payment verification

## Troubleshooting

### Common Issues

1. **Webhook signature verification fails**
   - Ensure `RAZORPAY_WEBHOOK_SECRET` is correctly set
   - Check that the webhook URL is accessible via ngrok

2. **Payment modal doesn't open**
   - Verify Razorpay script is loaded
   - Check browser console for JavaScript errors

3. **Payment succeeds but booking status doesn't update**
   - Check webhook logs in backend
   - Verify webhook endpoint is receiving events

### Debug Logs

Enable debug logging by setting:
```bash
LOG_LEVEL=debug
```

### Testing Checklist

- [ ] Backend server running on port 3002
- [ ] Frontend server running on port 3000
- [ ] ngrok exposing backend publicly
- [ ] Razorpay webhook configured with correct URL
- [ ] Environment variables properly set
- [ ] Database migration applied
- [ ] Test payment with success scenario
- [ ] Test payment with failure scenario
- [ ] Verify webhook events are received
- [ ] Check booking status updates correctly

## Security Considerations

1. **Never expose Razorpay Key Secret** in frontend code
2. **Always verify webhook signatures** before processing
3. **Validate payment amounts** match booking totals
4. **Use HTTPS** for all payment-related endpoints
5. **Implement rate limiting** on payment endpoints

## Production Deployment

1. Replace test keys with live Razorpay keys
2. Update webhook URL to production domain
3. Ensure SSL certificate is valid
4. Monitor payment success rates
5. Set up alerting for failed payments

## Support

For issues with Razorpay integration:
1. Check Razorpay documentation: https://razorpay.com/docs/
2. Review webhook logs in Razorpay dashboard
3. Check application logs for error details
