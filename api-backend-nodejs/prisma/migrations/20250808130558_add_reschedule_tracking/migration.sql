-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "rescheduleCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "salons" ADD COLUMN     "maxRescheduleLimit" INTEGER DEFAULT 3;
