/*
  Warnings:

  - A unique constraint covering the columns `[retailer_id,retailer_code]` on the table `suggestionDetails` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "suggestionDetails" ALTER COLUMN "brand_name" SET DATA TYPE VARCHAR(200);

-- CreateIndex
CREATE UNIQUE INDEX "suggestionDetails_retailer_id_retailer_code_key" ON "suggestionDetails"("retailer_id", "retailer_code");
