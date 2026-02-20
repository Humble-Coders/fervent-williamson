/*
  Warnings:

  - A unique constraint covering the columns `[displayId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "displayId" SERIAL NOT NULL,
ADD COLUMN     "salonDisplayId" INTEGER,
ADD COLUMN     "serviceDisplayId" INTEGER,
ADD COLUMN     "stylistDisplayId" INTEGER,
ADD COLUMN     "userDisplayId" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "displayId" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_displayId_key" ON "bookings"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "users_displayId_key" ON "users"("displayId");
