/*
  Warnings:

  - The values [DISCOUNT,SERVICE,PREMIUM] on the enum `OfferType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `badge` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `emoji` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `gradient` on the `offers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[displayId]` on the table `salons` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `services` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `value` to the `offers` table without a default value. This is not possible if the table is not empty.
  - Made the column `validUntil` on table `offers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OfferType_new" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SERVICE', 'BOGO');
ALTER TABLE "offers" ALTER COLUMN "type" TYPE "OfferType_new" USING ("type"::text::"OfferType_new");
ALTER TYPE "OfferType" RENAME TO "OfferType_old";
ALTER TYPE "OfferType_new" RENAME TO "OfferType";
DROP TYPE "OfferType_old";
COMMIT;

-- AlterTable
ALTER TABLE "offers" DROP COLUMN "badge",
DROP COLUMN "discount",
DROP COLUMN "emoji",
DROP COLUMN "gradient",
ADD COLUMN     "code" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxDiscount" DOUBLE PRECISION,
ADD COLUMN     "minPurchase" DOUBLE PRECISION,
ADD COLUMN     "usageLimit" INTEGER,
ADD COLUMN     "value" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "validFrom" DROP DEFAULT,
ALTER COLUMN "validUntil" SET NOT NULL;

-- AlterTable
ALTER TABLE "reviews" ALTER COLUMN "service" DROP NOT NULL,
ALTER COLUMN "verified" SET DEFAULT true,
ALTER COLUMN "emoji" DROP NOT NULL;

-- AlterTable
ALTER TABLE "salons" ADD COLUMN     "displayId" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "displayId" SERIAL NOT NULL;

-- CreateTable
CREATE TABLE "_UserOffers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserOffers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UserOffers_B_index" ON "_UserOffers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "salons_displayId_key" ON "salons"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "services_displayId_key" ON "services"("displayId");

-- AddForeignKey
ALTER TABLE "_UserOffers" ADD CONSTRAINT "_UserOffers_A_fkey" FOREIGN KEY ("A") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserOffers" ADD CONSTRAINT "_UserOffers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
