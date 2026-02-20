-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "verificationCode" TEXT;

-- AlterTable
ALTER TABLE "salons" ADD COLUMN     "allowSameDayBooking" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bufferTime" INTEGER DEFAULT 15,
ADD COLUMN     "enabledPaymentMethods" TEXT[] DEFAULT ARRAY['card', 'wallet', 'cash']::TEXT[],
ADD COLUMN     "maxBookingsPerDay" INTEGER DEFAULT 20;

-- CreateTable
CREATE TABLE "payment_method_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_method_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_configs_name_key" ON "payment_method_configs"("name");
