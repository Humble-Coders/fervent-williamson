/*
  Warnings:

  - You are about to drop the column `canVary` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `canVary` on the `sub_services` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "services" DROP COLUMN "canVary",
ADD COLUMN     "priceCanVary" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sub_services" DROP COLUMN "canVary",
ADD COLUMN     "priceCanVary" BOOLEAN NOT NULL DEFAULT false;
