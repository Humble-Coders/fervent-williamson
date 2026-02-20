/*
  Warnings:

  - A unique constraint covering the columns `[displayId]` on the table `stylists` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "stylists" ADD COLUMN     "displayId" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "stylists_displayId_key" ON "stylists"("displayId");
