-- AlterTable
ALTER TABLE "AdSuggestedGroup" ADD COLUMN     "is_matched" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AdSuggestedProduct" ADD COLUMN     "is_matched" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AdvertisementItem" ADD COLUMN     "brand_id" UUID;

-- CreateTable
CREATE TABLE "AdSuggestedBrand" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "brand_id" UUID NOT NULL,
    "ad_item_id" UUID NOT NULL,
    "match_score" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "is_matched" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdSuggestedBrand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdSuggestedBrand_brand_id_ad_item_id_key" ON "AdSuggestedBrand"("brand_id", "ad_item_id");

-- AddForeignKey
ALTER TABLE "AdSuggestedBrand" ADD CONSTRAINT "AdSuggestedBrand_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSuggestedBrand" ADD CONSTRAINT "AdSuggestedBrand_ad_item_id_fkey" FOREIGN KEY ("ad_item_id") REFERENCES "AdvertisementItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertisementItem" ADD CONSTRAINT "AdvertisementItem_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
