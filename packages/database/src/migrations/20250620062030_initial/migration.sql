-- CreateEnum
CREATE TYPE "AdvertisementType" AS ENUM ('STANDARD', 'SEASONAL', 'CATEGORY_EVENT', 'SOCIAL_MEDIA', 'PRINT', 'EMAIL');

-- CreateTable
CREATE TABLE "AdSuggestedGroup" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "product_group_id" UUID NOT NULL,
    "ad_item_id" UUID NOT NULL,
    "match_score" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdSuggestedGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdSuggestedProduct" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "product_id" UUID NOT NULL,
    "ad_item_id" UUID NOT NULL,
    "match_score" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdSuggestedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Advertisement" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "retailer_id" UUID NOT NULL,
    "advertisement_type" "AdvertisementType" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertisement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertisementImage" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "advertisement_id" UUID NOT NULL,
    "page_number" INTEGER NOT NULL,
    "ai_data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvertisementImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertisementItem" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ad_image_id" UUID NOT NULL,
    "advertisement_text" TEXT NOT NULL,
    "retail_price" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "promotional_price" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvertisementItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdSuggestedGroup_product_group_id_ad_item_id_key" ON "AdSuggestedGroup"("product_group_id", "ad_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "AdSuggestedProduct_product_id_ad_item_id_key" ON "AdSuggestedProduct"("product_id", "ad_item_id");

-- AddForeignKey
ALTER TABLE "AdSuggestedGroup" ADD CONSTRAINT "AdSuggestedGroup_product_group_id_fkey" FOREIGN KEY ("product_group_id") REFERENCES "ProductGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSuggestedGroup" ADD CONSTRAINT "AdSuggestedGroup_ad_item_id_fkey" FOREIGN KEY ("ad_item_id") REFERENCES "AdvertisementItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSuggestedProduct" ADD CONSTRAINT "AdSuggestedProduct_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "MasterProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSuggestedProduct" ADD CONSTRAINT "AdSuggestedProduct_ad_item_id_fkey" FOREIGN KEY ("ad_item_id") REFERENCES "AdvertisementItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advertisement" ADD CONSTRAINT "Advertisement_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "Retailer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertisementImage" ADD CONSTRAINT "AdvertisementImage_advertisement_id_fkey" FOREIGN KEY ("advertisement_id") REFERENCES "Advertisement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertisementItem" ADD CONSTRAINT "AdvertisementItem_ad_image_id_fkey" FOREIGN KEY ("ad_image_id") REFERENCES "AdvertisementImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
