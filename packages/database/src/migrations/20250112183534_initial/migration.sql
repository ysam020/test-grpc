/*
  Warnings:

  - You are about to drop the column `promo_type` on the `RetailerCurrentPricing` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RetailerCurrentPricing" DROP COLUMN "promo_type",
ADD COLUMN     "promotion_type" "PromotionTypeEnum" NOT NULL DEFAULT 'RETAILER';
