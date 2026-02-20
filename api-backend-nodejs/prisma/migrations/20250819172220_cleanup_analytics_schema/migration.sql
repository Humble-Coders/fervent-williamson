-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('PAGE_VIEW', 'ACTION', 'CONVERSION', 'ERROR', 'COMMUNICATION', 'NOTIFICATION', 'BUSINESS_EVENT');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('MOBILE', 'DESKTOP', 'TABLET');

-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('SENT', 'DELIVERED', 'FAILED', 'OPENED', 'CLICKED', 'BOUNCED', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "BusinessEventType" AS ENUM ('BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_COMPLETED', 'PAYMENT_INITIATED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'SALON_REGISTERED', 'SALON_VERIFIED', 'SERVICE_CREATED', 'USER_REGISTERED', 'USER_VERIFIED');

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "eventType" "AnalyticsEventType" NOT NULL,
    "page" TEXT NOT NULL,
    "action" TEXT,
    "salonId" TEXT,
    "salonDisplayId" INTEGER,
    "serviceId" TEXT,
    "serviceDisplayId" INTEGER,
    "stylistId" TEXT,
    "stylistDisplayId" INTEGER,
    "bookingId" TEXT,
    "bookingDisplayId" INTEGER,
    "userRole" "UserRole",
    "deviceType" "DeviceType",
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "referrer" TEXT,
    "metadata" JSONB,
    "duration" INTEGER,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "communicationType" "CommunicationType" NOT NULL,
    "communicationStatus" TEXT NOT NULL,
    "recipientPhone" TEXT,
    "recipientEmail" TEXT,
    "messageTemplate" TEXT,
    "salonId" TEXT,
    "salonDisplayId" INTEGER,
    "bookingId" TEXT,
    "bookingDisplayId" INTEGER,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_config" (
    "id" TEXT NOT NULL,
    "configKey" TEXT NOT NULL,
    "configValue" JSONB NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_userId_idx" ON "analytics_events"("userId");

-- CreateIndex
CREATE INDEX "analytics_events_eventType_idx" ON "analytics_events"("eventType");

-- CreateIndex
CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");

-- CreateIndex
CREATE INDEX "communication_analytics_userId_idx" ON "communication_analytics"("userId");

-- CreateIndex
CREATE INDEX "communication_analytics_communicationType_idx" ON "communication_analytics"("communicationType");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_config_configKey_key" ON "analytics_config"("configKey");
