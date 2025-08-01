/*
  Warnings:

  - You are about to drop the column `pack_count` on the `MasterProduct` table. All the data in the column will be lost.
  - You are about to drop the column `package_unit` on the `MasterProduct` table. All the data in the column will be lost.
  - You are about to drop the column `product_volume` on the `MasterProduct` table. All the data in the column will be lost.
  - You are about to drop the column `volume_unit` on the `MasterProduct` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UnitEnum" AS ENUM ('GM', 'KG', 'ML', 'LTR', 'MG', 'PACK');

-- AlterTable
ALTER TABLE "MasterProduct" DROP COLUMN "pack_count",
DROP COLUMN "package_unit",
DROP COLUMN "product_volume",
DROP COLUMN "volume_unit",
ADD COLUMN     "a2c_size" VARCHAR(50),
ADD COLUMN     "configuration" VARCHAR(50),
ADD COLUMN     "size" INTEGER,
ADD COLUMN     "unit" "UnitEnum";

-- AlterTable
ALTER TABLE "suggestionDetails" ADD COLUMN     "a2c_size" VARCHAR(50),
ADD COLUMN     "configuration" VARCHAR(50),
ADD COLUMN     "size" INTEGER,
ADD COLUMN     "unit" "UnitEnum";
