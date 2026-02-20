-- AlterTable
ALTER TABLE "stylists" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
