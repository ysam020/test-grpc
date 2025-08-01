/*
  Warnings:

  - You are about to alter the column `size` on the `MasterProduct` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `size` on the `suggestionDetails` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "MasterProduct" ALTER COLUMN "size" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "suggestionDetails" ALTER COLUMN "size" SET DATA TYPE DECIMAL(10,2);
