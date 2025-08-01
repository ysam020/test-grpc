/*
  Warnings:

  - You are about to alter the column `rating` on the `SampleReview` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "SampleReview" ALTER COLUMN "rating" SET DEFAULT 0.0,
ALTER COLUMN "rating" SET DATA TYPE DECIMAL(10,2);
