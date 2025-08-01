/*
  Warnings:

  - A unique constraint covering the columns `[barcode,retailer_id,retailer_code]` on the table `RetailerCurrentPricing` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "RetailerCurrentPricing_barcode_retailer_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "RetailerCurrentPricing_barcode_retailer_id_retailer_code_key" ON "RetailerCurrentPricing"("barcode", "retailer_id", "retailer_code");
