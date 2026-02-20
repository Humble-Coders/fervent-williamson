-- CreateTable
CREATE TABLE "booking_items" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "subServiceId" TEXT,
    "stylistId" TEXT,
    "duration" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "serviceDisplayId" INTEGER,
    "subServiceDisplayId" INTEGER,
    "stylistDisplayId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_subServiceId_fkey" FOREIGN KEY ("subServiceId") REFERENCES "sub_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_stylistId_fkey" FOREIGN KEY ("stylistId") REFERENCES "stylists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
