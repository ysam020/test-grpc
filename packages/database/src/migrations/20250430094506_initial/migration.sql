-- CreateEnum
CREATE TYPE "ProductGroupTypeEnum" AS ENUM ('PROMOTIONAL_BUNDLE', 'MULTI_PACK', 'SIZE_VARIANT');

-- CreateTable
CREATE TABLE "ProductGroup" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "group_name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ProductGroupTypeEnum" NOT NULL,

    CONSTRAINT "ProductGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductGroupProduct" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "group_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductGroupProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BrandToProductGroup" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductGroupProduct_group_id_product_id_key" ON "ProductGroupProduct"("group_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "_BrandToProductGroup_AB_unique" ON "_BrandToProductGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_BrandToProductGroup_B_index" ON "_BrandToProductGroup"("B");

-- AddForeignKey
ALTER TABLE "ProductGroupProduct" ADD CONSTRAINT "ProductGroupProduct_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "ProductGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductGroupProduct" ADD CONSTRAINT "ProductGroupProduct_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "MasterProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BrandToProductGroup" ADD CONSTRAINT "_BrandToProductGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BrandToProductGroup" ADD CONSTRAINT "_BrandToProductGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
