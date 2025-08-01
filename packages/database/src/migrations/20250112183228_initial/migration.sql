-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- AlterEnum
ALTER TYPE "State" ADD VALUE 'SA';

-- AlterTable
ALTER TABLE "Preference" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "number_of_adult" INTEGER,
ADD COLUMN     "number_of_child" INTEGER,
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "RetailerCurrentPricing" ALTER COLUMN "promo_type" SET DEFAULT 'RETAILER';

-- CreateTable
CREATE TABLE "matchSuggestion" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "retailer_id" UUID NOT NULL,
    "suggestion_details_id" UUID NOT NULL,
    "matched_product_barcode" VARCHAR(50) NOT NULL,
    "match_confidence" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "date_matched" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matchSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SampleOption" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "question_id" UUID NOT NULL,
    "option" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SampleOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sample" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "client" TEXT,
    "description" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "maximum_sample" INTEGER NOT NULL,
    "location" TEXT[],
    "age" TEXT[],
    "state" TEXT[],
    "gender" TEXT NOT NULL DEFAULT 'both',
    "has_children" BOOLEAN NOT NULL DEFAULT false,
    "with_email_saved" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_draft" BOOLEAN NOT NULL,
    "to_get_product" TEXT NOT NULL,
    "task_to_do" TEXT NOT NULL,
    "inquiries" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SampleProduct" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "sample_id" UUID NOT NULL,
    "product_id" UUID,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SampleProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SampleQuestion" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "sample_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer_type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SampleQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SampleResponse" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "question_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "option_id" UUID,
    "text" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SampleResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SampleUser" (
    "sample_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SampleUser_pkey" PRIMARY KEY ("sample_id","user_id")
);

-- CreateTable
CREATE TABLE "SampleReview" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "sample_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SampleReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestionDetails" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "brand_name" VARCHAR(50) NOT NULL,
    "category_id" UUID NOT NULL,
    "product_name" VARCHAR(500) NOT NULL,
    "barcode" VARCHAR(50) NOT NULL,
    "current_price" VARCHAR(500) NOT NULL,
    "per_unit_price" VARCHAR(100) NOT NULL DEFAULT '',
    "retailer_code" VARCHAR(100) NOT NULL DEFAULT '',
    "offer_info" TEXT,
    "promotion_type" VARCHAR(100) NOT NULL DEFAULT 'RETAILER',
    "product_url" VARCHAR(1000) NOT NULL DEFAULT '',
    "image_url" VARCHAR(1000) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suggestionDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SampleProduct_sample_id_key" ON "SampleProduct"("sample_id");

-- CreateIndex
CREATE UNIQUE INDEX "SampleReview_sample_id_user_id_key" ON "SampleReview"("sample_id", "user_id");

-- AddForeignKey
ALTER TABLE "matchSuggestion" ADD CONSTRAINT "matchSuggestion_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchSuggestion" ADD CONSTRAINT "matchSuggestion_suggestion_details_id_fkey" FOREIGN KEY ("suggestion_details_id") REFERENCES "suggestionDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleOption" ADD CONSTRAINT "SampleOption_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "SampleQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleProduct" ADD CONSTRAINT "SampleProduct_sample_id_fkey" FOREIGN KEY ("sample_id") REFERENCES "Sample"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleProduct" ADD CONSTRAINT "SampleProduct_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "MasterProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleQuestion" ADD CONSTRAINT "SampleQuestion_sample_id_fkey" FOREIGN KEY ("sample_id") REFERENCES "Sample"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleResponse" ADD CONSTRAINT "SampleResponse_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleResponse" ADD CONSTRAINT "SampleResponse_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "SampleOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleResponse" ADD CONSTRAINT "SampleResponse_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "SampleQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleUser" ADD CONSTRAINT "SampleUser_sample_id_fkey" FOREIGN KEY ("sample_id") REFERENCES "Sample"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleUser" ADD CONSTRAINT "SampleUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleReview" ADD CONSTRAINT "SampleReview_sample_id_fkey" FOREIGN KEY ("sample_id") REFERENCES "Sample"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestionDetails" ADD CONSTRAINT "suggestionDetails_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
