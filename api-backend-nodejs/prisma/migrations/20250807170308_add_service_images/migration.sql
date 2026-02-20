-- AlterTable
ALTER TABLE "services" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
