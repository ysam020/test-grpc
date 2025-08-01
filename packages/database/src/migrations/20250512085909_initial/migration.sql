-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "supplier_id" UUID;

-- CreateTable
CREATE TABLE "Supplier" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "supplier_name" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_supplier_name_key" ON "Supplier"("supplier_name");

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
