/*
  Warnings:

  - The `experience` column on the `stylists` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `email` to the `stylists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `stylists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `services` to the `stylists` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stylists" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "services" JSONB NOT NULL,
DROP COLUMN "experience",
ADD COLUMN     "experience" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "emoji" DROP NOT NULL;
