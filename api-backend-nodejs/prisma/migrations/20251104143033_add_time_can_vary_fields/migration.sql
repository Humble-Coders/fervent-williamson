-- AlterTable
ALTER TABLE "services" ADD COLUMN     "timeCanVary" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sub_services" ADD COLUMN     "timeCanVary" BOOLEAN NOT NULL DEFAULT false;
