/*
  Warnings:

  - You are about to drop the column `category` on the `system_configs` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `system_configs` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `system_configs` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `system_configs` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `system_configs` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "system_configs" DROP COLUMN "category",
DROP COLUMN "description",
DROP COLUMN "isActive",
DROP COLUMN "name",
DROP COLUMN "type";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "gender" "Gender";
