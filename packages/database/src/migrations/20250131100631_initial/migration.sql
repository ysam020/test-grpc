/*
  Warnings:

  - You are about to drop the column `matched_product_barcode` on the `matchSuggestion` table. All the data in the column will be lost.
  - You are about to drop the column `retailer_id` on the `matchSuggestion` table. All the data in the column will be lost.
  - Added the required column `matched_product_pricing_id` to the `matchSuggestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `retailer_id` to the `suggestionDetails` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "matchSuggestion" DROP CONSTRAINT "matchSuggestion_retailer_id_fkey";

-- AlterTable
ALTER TABLE "matchSuggestion" DROP COLUMN "matched_product_barcode",
DROP COLUMN "retailer_id",
ADD COLUMN     "matched_product_pricing_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "suggestionDetails" ADD COLUMN     "retailer_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "suggestionDetails" ADD CONSTRAINT "suggestionDetails_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
