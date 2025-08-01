/*
  Warnings:

  - Added the required column `retailer_id` to the `matchSuggestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "matchSuggestion" ADD COLUMN     "retailer_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "matchSuggestion" ADD CONSTRAINT "matchSuggestion_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
