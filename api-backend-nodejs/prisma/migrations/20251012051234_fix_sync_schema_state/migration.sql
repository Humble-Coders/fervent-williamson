-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "subServiceDisplayId" INTEGER,
ADD COLUMN     "subServiceId" TEXT;

-- CreateTable
CREATE TABLE "sub_services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "serviceId" TEXT NOT NULL,
    "displayId" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "early_users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "type" TEXT NOT NULL,
    "position" SERIAL NOT NULL,
    "isNotified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "early_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sub_services_displayId_key" ON "sub_services"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "early_users_position_key" ON "early_users"("position");

-- CreateIndex
CREATE UNIQUE INDEX "early_users_email_key" ON "early_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "early_users_phone_key" ON "early_users"("phone");

-- AddForeignKey
ALTER TABLE "sub_services" ADD CONSTRAINT "sub_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_subServiceId_fkey" FOREIGN KEY ("subServiceId") REFERENCES "sub_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
