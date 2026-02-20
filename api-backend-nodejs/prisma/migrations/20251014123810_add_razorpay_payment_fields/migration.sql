-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'PAYMENT_PENDING';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PROCESSING';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "razorpaySignature" TEXT;
