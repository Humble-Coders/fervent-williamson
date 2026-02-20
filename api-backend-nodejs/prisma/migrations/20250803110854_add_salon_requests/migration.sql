-- CreateEnum
CREATE TYPE "SalonRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "salon_requests" (
    "id" TEXT NOT NULL,
    "salonName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "status" "SalonRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salon_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "salon_requests" ADD CONSTRAINT "salon_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
