-- AlterTable
ALTER TABLE "MasterProduct" ADD COLUMN     "pack_count" INTEGER,
ADD COLUMN     "package_unit" VARCHAR(50),
ADD COLUMN     "product_volume" INTEGER,
ADD COLUMN     "volume_unit" VARCHAR(50);
