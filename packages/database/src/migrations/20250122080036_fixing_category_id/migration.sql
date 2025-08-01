-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "suggestionDetails" ADD COLUMN     "pack_size" VARCHAR(100) NOT NULL DEFAULT '';
