-- DropForeignKey
ALTER TABLE "service_categories" DROP CONSTRAINT "service_categories_salonId_fkey";

-- DropIndex
DROP INDEX "service_categories_name_salonId_key";

-- AlterTable
ALTER TABLE "service_categories" DROP COLUMN "salonId",
ADD COLUMN "salonDisplayId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_name_salonDisplayId_key" ON "service_categories"("name", "salonDisplayId");

-- AddForeignKey
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_salonDisplayId_fkey" FOREIGN KEY ("salonDisplayId") REFERENCES "salons"("displayId") ON DELETE CASCADE ON UPDATE CASCADE;
