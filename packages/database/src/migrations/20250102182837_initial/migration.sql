-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "AdminNotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "BannerLinkType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PRICE_ALERT', 'ADMIN_NOTIFICATION', 'REGISTRATION');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH_NOTIFICATION', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "PromotionTypeEnum" AS ENUM ('BRAND', 'RETAILER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'BOTH');

-- CreateEnum
CREATE TYPE "Location" AS ENUM ('METRO', 'URBAN', 'RURAL', 'ALL');

-- CreateEnum
CREATE TYPE "State" AS ENUM ('ACT', 'NSW', 'NT', 'QLD', 'TAS', 'VIC', 'WA', 'ALL');

-- CreateEnum
CREATE TYPE "Age" AS ENUM ('CHILD', 'YOUNG_ADULT', 'ADULT', 'MIDDLE_AGED', 'SENIOR_ADULT', 'OLDER_ADULT', 'SENIOR', 'ALL');

-- CreateEnum
CREATE TYPE "AuthProviderEnum" AS ENUM ('INTERNAL', 'GOOGLE', 'META', 'APPLE');

-- CreateEnum
CREATE TYPE "WidgetStatusEnum" AS ENUM ('DRAFT', 'PUBLISH', 'ACTIVE');

-- CreateEnum
CREATE TYPE "WidgetComponentType" AS ENUM ('BANNER', 'PRODUCT_SLIDER', 'SURVEY');

-- CreateEnum
CREATE TYPE "ReferenceModelType" AS ENUM ('BANNER', 'PRODUCT_SLIDER', 'SURVEY');

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "AdminNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "channels" JSONB[],
    "target_users" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "banner_name" TEXT NOT NULL,
    "link_type" "BannerLinkType" NOT NULL,
    "link" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Basket" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Basket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BasketItem" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "basket_id" UUID NOT NULL,
    "master_product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BasketItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "brand_name" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "category_name" TEXT NOT NULL,
    "parent_category_id" UUID,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterProduct" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "barcode" VARCHAR(50) NOT NULL,
    "product_name" TEXT NOT NULL,
    "pack_size" VARCHAR(50) NOT NULL,
    "brand_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "image_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "type" "NotificationType" NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "price_alert_id" UUID,
    "admin_notification_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "channel" "NotificationChannel",

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preference" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "target_price" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSlider" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "promotion_type" "PromotionTypeEnum" NOT NULL,
    "module_name" TEXT NOT NULL,
    "number_of_product" INTEGER NOT NULL,
    "sort_by_field" TEXT NOT NULL,
    "sort_by_order" TEXT NOT NULL,
    "background_color" TEXT,
    "brand_logo" TEXT,

    CONSTRAINT "ProductSlider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Retailer" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "retailer_name" TEXT NOT NULL,
    "site_url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Retailer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailerCurrentPricing" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "product_id" UUID NOT NULL,
    "barcode" VARCHAR(50) NOT NULL,
    "retailer_id" UUID NOT NULL,
    "retailer_code" VARCHAR(100) NOT NULL DEFAULT '',
    "current_price" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "was_price" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "per_unit_price" VARCHAR(100) NOT NULL DEFAULT '',
    "offer_info" TEXT,
    "promo_type" "PromotionTypeEnum" NOT NULL,
    "product_url" VARCHAR(1000) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetailerCurrentPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyOption" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "question_id" UUID NOT NULL,
    "option" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SurveyOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "client" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "targetAudience" INTEGER,
    "location" TEXT[],
    "state" TEXT[],
    "age" TEXT[],
    "gender" TEXT[],
    "hasChildren" BOOLEAN NOT NULL DEFAULT false,
    "withEmailSaved" BOOLEAN NOT NULL DEFAULT false,
    "is_draft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyQuestion" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "survey_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "multiSelect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SurveyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "question_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "email" TEXT,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "otp" INTEGER,
    "profile_pic" TEXT,
    "is_deleted" BOOLEAN DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'user',
    "notification_limit" INTEGER,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "device_endpoint_arn" TEXT,
    "phone_number" TEXT,
    "birth_date" TIMESTAMP(3),
    "age" INTEGER,
    "auth_provider" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postcode" INTEGER,
    "no_of_adult" INTEGER,
    "no_of_children" INTEGER,
    "gender" "Gender",

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Widget" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "widget_name" TEXT NOT NULL,
    "status" "WidgetStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "deploy_date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Widget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WidgetComponent" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "widget_id" UUID NOT NULL,
    "component_type" "WidgetComponentType" NOT NULL,
    "order" INTEGER NOT NULL,
    "reference_model_id" UUID NOT NULL,
    "reference_model" "ReferenceModelType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WidgetComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BrandToProductSlider" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_CategoryToProductSlider" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_PreferenceToRetailer" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ProductSliderToRetailer" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Basket_user_id_key" ON "Basket"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "BasketItem_basket_id_master_product_id_key" ON "BasketItem"("basket_id", "master_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_brand_name_key" ON "Brand"("brand_name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_category_name_parent_category_id_key" ON "Category"("category_name", "parent_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "masterproductmatched_unique" ON "MasterProduct"("barcode");

-- CreateIndex
CREATE INDEX "idx_masterproductmatched_productname" ON "MasterProduct"("product_name");

-- CreateIndex
CREATE UNIQUE INDEX "MasterProduct_barcode_key" ON "MasterProduct"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Preference_user_id_key" ON "Preference"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "PriceAlert_user_id_product_id_key" ON "PriceAlert"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "Retailer_retailer_name_key" ON "Retailer"("retailer_name");

-- CreateIndex
CREATE INDEX "idx_retailercurrentpricingmatched_productid" ON "RetailerCurrentPricing"("product_id");

-- CreateIndex
CREATE INDEX "idx_retailercurrentpricingmatched_barcode" ON "RetailerCurrentPricing"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "RetailerCurrentPricing_barcode_retailer_id_key" ON "RetailerCurrentPricing"("barcode", "retailer_id");

-- CreateIndex
CREATE UNIQUE INDEX "Survey_name_key" ON "Survey"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyQuestion_survey_id_key" ON "SurveyQuestion"("survey_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Widget_widget_name_key" ON "Widget"("widget_name");

-- CreateIndex
CREATE UNIQUE INDEX "WidgetComponent_widget_id_reference_model_id_key" ON "WidgetComponent"("widget_id", "reference_model_id");

-- CreateIndex
CREATE UNIQUE INDEX "_BrandToProductSlider_AB_unique" ON "_BrandToProductSlider"("A", "B");

-- CreateIndex
CREATE INDEX "_BrandToProductSlider_B_index" ON "_BrandToProductSlider"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToProductSlider_AB_unique" ON "_CategoryToProductSlider"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryToProductSlider_B_index" ON "_CategoryToProductSlider"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PreferenceToRetailer_AB_unique" ON "_PreferenceToRetailer"("A", "B");

-- CreateIndex
CREATE INDEX "_PreferenceToRetailer_B_index" ON "_PreferenceToRetailer"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductSliderToRetailer_AB_unique" ON "_ProductSliderToRetailer"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductSliderToRetailer_B_index" ON "_ProductSliderToRetailer"("B");

-- AddForeignKey
ALTER TABLE "Basket" ADD CONSTRAINT "Basket_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BasketItem" ADD CONSTRAINT "BasketItem_basket_id_fkey" FOREIGN KEY ("basket_id") REFERENCES "Basket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BasketItem" ADD CONSTRAINT "BasketItem_master_product_id_fkey" FOREIGN KEY ("master_product_id") REFERENCES "MasterProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterProduct" ADD CONSTRAINT "MasterProduct_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterProduct" ADD CONSTRAINT "MasterProduct_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preference" ADD CONSTRAINT "Preference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "MasterProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailerCurrentPricing" ADD CONSTRAINT "RetailerCurrentPricing_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "MasterProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailerCurrentPricing" ADD CONSTRAINT "RetailerCurrentPricing_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyOption" ADD CONSTRAINT "SurveyOption_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "SurveyQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyQuestion" ADD CONSTRAINT "SurveyQuestion_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "SurveyQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "SurveyOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetComponent" ADD CONSTRAINT "WidgetComponent_widget_id_fkey" FOREIGN KEY ("widget_id") REFERENCES "Widget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BrandToProductSlider" ADD CONSTRAINT "_BrandToProductSlider_A_fkey" FOREIGN KEY ("A") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BrandToProductSlider" ADD CONSTRAINT "_BrandToProductSlider_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductSlider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToProductSlider" ADD CONSTRAINT "_CategoryToProductSlider_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToProductSlider" ADD CONSTRAINT "_CategoryToProductSlider_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductSlider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PreferenceToRetailer" ADD CONSTRAINT "_PreferenceToRetailer_A_fkey" FOREIGN KEY ("A") REFERENCES "Preference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PreferenceToRetailer" ADD CONSTRAINT "_PreferenceToRetailer_B_fkey" FOREIGN KEY ("B") REFERENCES "Retailer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductSliderToRetailer" ADD CONSTRAINT "_ProductSliderToRetailer_A_fkey" FOREIGN KEY ("A") REFERENCES "ProductSlider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductSliderToRetailer" ADD CONSTRAINT "_ProductSliderToRetailer_B_fkey" FOREIGN KEY ("B") REFERENCES "Retailer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
