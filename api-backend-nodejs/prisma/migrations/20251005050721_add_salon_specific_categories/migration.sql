/*
  Warnings:

  - A unique constraint covering the columns `[name,salonId]` on the table `service_categories` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "service_categories_name_key";

-- AlterTable
ALTER TABLE "service_categories" ADD COLUMN     "isGlobal" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "salonId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_name_salonId_key" ON "service_categories"("name", "salonId");

-- AddForeignKey
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "salons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
