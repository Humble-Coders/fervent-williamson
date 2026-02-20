-- AlterTable
ALTER TABLE "services" ADD COLUMN     "canVary" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sub_services" ADD COLUMN     "canVary" BOOLEAN NOT NULL DEFAULT false;
