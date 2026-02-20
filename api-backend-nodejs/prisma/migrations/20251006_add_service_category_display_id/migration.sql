/*
  Warnings:

  - A unique constraint covering the columns `[displayId]` on the table `service_categories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "service_categories" ADD COLUMN "displayId" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_displayId_key" ON "service_categories"("displayId");
