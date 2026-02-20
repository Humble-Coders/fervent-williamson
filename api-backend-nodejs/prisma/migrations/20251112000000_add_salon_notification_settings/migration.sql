-- AlterTable
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "smsNotifications" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "reminderHours" INTEGER DEFAULT 24;

-- AlterTable - Fix minimumNoticeHours type from Int to Float
ALTER TABLE "salons" ALTER COLUMN "minimumNoticeHours" TYPE DOUBLE PRECISION;

