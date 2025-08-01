-- DropForeignKey
ALTER TABLE "BasketItem" DROP CONSTRAINT "BasketItem_master_product_id_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_parent_category_id_fkey";

-- DropForeignKey
ALTER TABLE "MasterProduct" DROP CONSTRAINT "MasterProduct_category_id_fkey";

-- DropForeignKey
ALTER TABLE "PriceAlert" DROP CONSTRAINT "PriceAlert_product_id_fkey";

-- DropForeignKey
ALTER TABLE "RetailerCurrentPricing" DROP CONSTRAINT "RetailerCurrentPricing_product_id_fkey";

-- DropForeignKey
ALTER TABLE "SampleProduct" DROP CONSTRAINT "SampleProduct_product_id_fkey";

-- DropForeignKey
ALTER TABLE "matchSuggestion" DROP CONSTRAINT "matchSuggestion_suggestion_details_id_fkey";

-- DropForeignKey
ALTER TABLE "suggestionDetails" DROP CONSTRAINT "suggestionDetails_category_id_fkey";

-- AddForeignKey
ALTER TABLE "BasketItem" ADD CONSTRAINT "BasketItem_master_product_id_fkey" FOREIGN KEY ("master_product_id") REFERENCES "MasterProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterProduct" ADD CONSTRAINT "MasterProduct_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchSuggestion" ADD CONSTRAINT "matchSuggestion_suggestion_details_id_fkey" FOREIGN KEY ("suggestion_details_id") REFERENCES "suggestionDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "MasterProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailerCurrentPricing" ADD CONSTRAINT "RetailerCurrentPricing_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "MasterProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleProduct" ADD CONSTRAINT "SampleProduct_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "MasterProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestionDetails" ADD CONSTRAINT "suggestionDetails_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
