-- CreateEnum
CREATE TYPE "InternalLinkType" AS ENUM ('PRODUCT', 'SAMPLE');

-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "internal_link_type" "InternalLinkType",
ADD COLUMN     "promotion_type" "PromotionTypeEnum",
ADD COLUMN     "sample_id" UUID;

-- CreateTable
CREATE TABLE "_BannerToBrand" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_BannerToRetailer" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_BannerToCategory" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_BannerToBrand_AB_unique" ON "_BannerToBrand"("A", "B");

-- CreateIndex
CREATE INDEX "_BannerToBrand_B_index" ON "_BannerToBrand"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_BannerToRetailer_AB_unique" ON "_BannerToRetailer"("A", "B");

-- CreateIndex
CREATE INDEX "_BannerToRetailer_B_index" ON "_BannerToRetailer"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_BannerToCategory_AB_unique" ON "_BannerToCategory"("A", "B");

-- CreateIndex
CREATE INDEX "_BannerToCategory_B_index" ON "_BannerToCategory"("B");

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_sample_id_fkey" FOREIGN KEY ("sample_id") REFERENCES "Sample"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BannerToBrand" ADD CONSTRAINT "_BannerToBrand_A_fkey" FOREIGN KEY ("A") REFERENCES "Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BannerToBrand" ADD CONSTRAINT "_BannerToBrand_B_fkey" FOREIGN KEY ("B") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BannerToRetailer" ADD CONSTRAINT "_BannerToRetailer_A_fkey" FOREIGN KEY ("A") REFERENCES "Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BannerToRetailer" ADD CONSTRAINT "_BannerToRetailer_B_fkey" FOREIGN KEY ("B") REFERENCES "Retailer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BannerToCategory" ADD CONSTRAINT "_BannerToCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BannerToCategory" ADD CONSTRAINT "_BannerToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
