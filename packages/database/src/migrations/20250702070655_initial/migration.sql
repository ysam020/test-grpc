-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "retailer_current_pricing_id" UUID NOT NULL,
    "rrp" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "current_price" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_retailer_current_pricing_id_fkey" FOREIGN KEY ("retailer_current_pricing_id") REFERENCES "RetailerCurrentPricing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
