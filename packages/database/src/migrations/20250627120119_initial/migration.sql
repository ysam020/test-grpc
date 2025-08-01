/*
  Warnings:

  - You are about to drop the column `manual_match` on the `AdvertisementItem` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AdvertisementStatus" AS ENUM ('IN_PROGRESS', 'NEEDS_REVIEW', 'COMPLETED');

-- AlterTable
ALTER TABLE "Advertisement" ADD COLUMN     "advertisement_status" "AdvertisementStatus" NOT NULL DEFAULT 'IN_PROGRESS',
ADD COLUMN     "match_percentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_pages" INTEGER;

-- AlterTable
ALTER TABLE "AdvertisementItem" DROP COLUMN "manual_match",
ADD COLUMN     "is_matched" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "product_group_id" UUID,
ADD COLUMN     "product_id" UUID;

-- AddForeignKey
ALTER TABLE "AdvertisementItem" ADD CONSTRAINT "AdvertisementItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "MasterProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertisementItem" ADD CONSTRAINT "AdvertisementItem_product_group_id_fkey" FOREIGN KEY ("product_group_id") REFERENCES "ProductGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
