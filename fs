add-to-cart-backend
├── .dockerignore
├── .env.local
├── .github
│   └── workflows
│       └── deploy-stage.yml
├── .gitignore
├── .husky
│   ├── commit-msg
│   ├── pre-commit
│   └── pre-push
├── .npmrc
├── .prettierignore
├── .prettierrc
├── .vscode
│   └── settings.json
├── README.md
├── apps
│   ├── api-gateway-service
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── client.ts
│   │   │   ├── controllers
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── basket.controller.ts
│   │   │   │   ├── catalogue.controller.ts
│   │   │   │   ├── dashboard.controller.ts
│   │   │   │   ├── layout.controller.ts
│   │   │   │   ├── notification.controller.ts
│   │   │   │   ├── priceAlert.controller.ts
│   │   │   │   ├── product.controller.ts
│   │   │   │   ├── redis.controller.ts
│   │   │   │   ├── sample.controller.ts
│   │   │   │   ├── survey.controller.ts
│   │   │   │   ├── user.controller.ts
│   │   │   │   └── widget.controller.ts
│   │   │   ├── middlewares
│   │   │   │   ├── uploadFile.middleware.ts
│   │   │   │   └── validation.middleware.ts
│   │   │   ├── routes
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── basket.routes.ts
│   │   │   │   ├── catalogue.routes.ts
│   │   │   │   ├── dashboard.routes.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── layout.routes.ts
│   │   │   │   ├── notification.routes.ts
│   │   │   │   ├── priceAlert.routes.ts
│   │   │   │   ├── product.routes.ts
│   │   │   │   ├── redis.routes.ts
│   │   │   │   ├── sample.routes.ts
│   │   │   │   ├── survey.routes.ts
│   │   │   │   ├── user.routes.ts
│   │   │   │   └── widget.routes.ts
│   │   │   ├── server.ts
│   │   │   └── services
│   │   │       ├── client.service.ts
│   │   │       └── product-slider.service.ts
│   │   └── tsconfig.json
│   ├── auth-management-service
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── client.ts
│   │   │   ├── handlers
│   │   │   │   ├── forgotPassword.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── loginUser.ts
│   │   │   │   ├── oauthRegister.ts
│   │   │   │   ├── refreshToken.ts
│   │   │   │   ├── registerUser.ts
│   │   │   │   ├── resendEmail.ts
│   │   │   │   ├── resetPassword.ts
│   │   │   │   └── verifyUser.ts
│   │   │   ├── index.ts
│   │   │   ├── server.ts
│   │   │   ├── services
│   │   │   │   ├── OAuth
│   │   │   │   │   ├── apple-auth.ts
│   │   │   │   │   ├── fb-auth.ts
│   │   │   │   │   └── google-auth.ts
│   │   │   │   └── model-services.ts
│   │   │   └── validations
│   │   │       └── index.ts
│   │   └── tsconfig.json
│   ├── catalogue-management-service
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── client.ts
│   │   │   ├── handlers
│   │   │   │   ├── addAdvertisementItem.ts
│   │   │   │   ├── attachProductsToGroup.ts
│   │   │   │   ├── createAdvertisement.ts
│   │   │   │   ├── createProductGroup.ts
│   │   │   │   ├── deleteAdvertisement.ts
│   │   │   │   ├── deleteProductGroup.ts
│   │   │   │   ├── exportToExcel.ts
│   │   │   │   ├── exportToExcelAdvertisements.ts
│   │   │   │   ├── finishLaterAdvertisement.ts
│   │   │   │   ├── getAdvertisements.ts
│   │   │   │   ├── getAllProductGroups.ts
│   │   │   │   ├── getAttachedProducts.ts
│   │   │   │   ├── getProductGroup.ts
│   │   │   │   ├── getSingleAdvertisement.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── markAsCompleteAdvertisement.ts
│   │   │   │   ├── matchAdvertisementItem.ts
│   │   │   │   ├── removeProductsFromGroup.ts
│   │   │   │   ├── toggleManualMatchAdItem.ts
│   │   │   │   ├── updateAdvertisement.ts
│   │   │   │   └── updateProductGroup.ts
│   │   │   ├── index.ts
│   │   │   ├── server.ts
│   │   │   ├── services
│   │   │   │   ├── client.service.ts
│   │   │   │   └── model.service.ts
│   │   │   └── validations
│   │   │       └── index.ts
│   │   └── tsconfig.json
│   ├── health-management-service
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── index.ts
│   │   │   └── server.ts
│   │   └── tsconfig.json
│   ├── notification-management-service
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── client.ts
│   │   │   ├── handlers
│   │   │   │   ├── addPriceAlert.ts
│   │   │   │   ├── createAdminNotification.ts
│   │   │   │   ├── createNotification.ts
│   │   │   │   ├── deleteAdminNotification.ts
│   │   │   │   ├── deletePriceAlert.ts
│   │   │   │   ├── getAdminNotifications.ts
│   │   │   │   ├── getAverageNotificationCount.ts
│   │   │   │   ├── getNotifications.ts
│   │   │   │   ├── getPriceAlerts.ts
│   │   │   │   ├── getSingleAdminNotification.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── retryAdminNotification.ts
│   │   │   │   └── updateAdminNotification.ts
│   │   │   ├── index.ts
│   │   │   ├── server.ts
│   │   │   ├── services
│   │   │   │   ├── client.service.ts
│   │   │   │   └── model.service.ts
│   │   │   └── validations
│   │   │       └── index.ts
│   │   └── tsconfig.json
│   ├── product-management-service
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── client.ts
│   │   │   ├── database
│   │   │   │   └── rawDB.ts
│   │   │   ├── handlers
│   │   │   │   ├── addBarcodeToRedis.ts
│   │   │   │   ├── addBrand.ts
│   │   │   │   ├── addCategory.ts
│   │   │   │   ├── addProduct.ts
│   │   │   │   ├── addProductFromSuggestion.ts
│   │   │   │   ├── addRetailer.ts
│   │   │   │   ├── addSupplier.ts
│   │   │   │   ├── checkBarcodeExistence.ts
│   │   │   │   ├── deleteCategory.ts
│   │   │   │   ├── deleteProduct.ts
│   │   │   │   ├── exportToExcel.ts
│   │   │   │   ├── getAllCategoryList.ts
│   │   │   │   ├── getAllProducts.ts
│   │   │   │   ├── getBrandList.ts
│   │   │   │   ├── getCategoryList.ts
│   │   │   │   ├── getNewProductList.ts
│   │   │   │   ├── getPotentialMatchList.ts
│   │   │   │   ├── getProductByCategoryCount.ts
│   │   │   │   ├── getProductByIDs.ts
│   │   │   │   ├── getProductByRetailerCount.ts
│   │   │   │   ├── getProductEngagement.ts
│   │   │   │   ├── getProductListHandler.ts
│   │   │   │   ├── getProductListWithRetailerCode.ts
│   │   │   │   ├── getProductsCount.ts
│   │   │   │   ├── getProductsForProductGroup.ts
│   │   │   │   ├── getRetailerList.ts
│   │   │   │   ├── getSubCategories.ts
│   │   │   │   ├── getSupplierList.ts
│   │   │   │   ├── importExcelData.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── matchProduct.ts
│   │   │   │   ├── productDetails.ts
│   │   │   │   ├── productSearch.ts
│   │   │   │   ├── syncDataInElastic.ts
│   │   │   │   ├── toggleIntervention.ts
│   │   │   │   ├── updateAdminProduct.ts
│   │   │   │   ├── updateBrand.ts
│   │   │   │   ├── updateCategory.ts
│   │   │   │   ├── updateProduct.ts
│   │   │   │   ├── updateRetailer.ts
│   │   │   │   └── updateSupplier.ts
│   │   │   ├── index.ts
│   │   │   ├── server.ts
│   │   │   ├── services
│   │   │   │   ├── client.service.ts
│   │   │   │   ├── elastic-services.ts
│   │   │   │   └── model-services.ts
│   │   │   └── validations
│   │   │       └── index.ts
│   │   └── tsconfig.json
│   ├── sample-management-service
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── client.ts
│   │   │   ├── handlers
│   │   │   │   ├── createSample.ts
│   │   │   │   ├── deleteSample.ts
│   │   │   │   ├── exportToExcel.ts
│   │   │   │   ├── fetchAllSamplesForUser.ts
│   │   │   │   ├── fetchSampleForUser.ts
│   │   │   │   ├── getAllRequestedSamples.ts
│   │   │   │   ├── getAllReview.ts
│   │   │   │   ├── getAllSample.ts
│   │   │   │   ├── getSampleEngagement.ts
│   │   │   │   ├── getSampleStatus.ts
│   │   │   │   ├── getSamplesCount.ts
│   │   │   │   ├── getSingleSample.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── reviewSample.ts
│   │   │   │   ├── submitSampleAnswer.ts
│   │   │   │   ├── toggleSample.ts
│   │   │   │   └── updateSample.ts
│   │   │   ├── index.ts
│   │   │   ├── server.ts
│   │   │   ├── services
│   │   │   │   ├── client.service.ts
│   │   │   │   └── model.services.ts
│   │   │   └── validations
│   │   │       └── index.ts
│   │   └── tsconfig.json
│   ├── survey-management-service
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── client.ts
│   │   │   ├── handlers
│   │   │   │   ├── ToggleSurvey.ts
│   │   │   │   ├── createSurvey.ts
│   │   │   │   ├── deactivateSurvey.ts
│   │   │   │   ├── deleteSurvey.ts
│   │   │   │   ├── didUserAnswered.ts
│   │   │   │   ├── exportToExcel.ts
│   │   │   │   ├── getAllResponseByUserID.ts
│   │   │   │   ├── getAllSurvey.ts
│   │   │   │   ├── getSingleSurvey.ts
│   │   │   │   ├── getSurveyEngagement.ts
│   │   │   │   ├── getSurveysCount.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── submitSurveyAnswer.ts
│   │   │   │   └── updateSurvey.ts
│   │   │   ├── index.ts
│   │   │   ├── server.ts
│   │   │   ├── services
│   │   │   │   ├── client.service.ts
│   │   │   │   └── model.service.ts
│   │   │   └── validations
│   │   │       └── index.ts
│   │   └── tsconfig.json
│   ├── user-management-service
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── handlers
│   │   │   │   ├── acceptDeviceToken.ts
│   │   │   │   ├── addToBasket.ts
│   │   │   │   ├── changePassword.ts
│   │   │   │   ├── clearBasket.ts
│   │   │   │   ├── deleteUser.ts
│   │   │   │   ├── getMonthlyActiveUsersCount.ts
│   │   │   │   ├── getSingleUser.ts
│   │   │   │   ├── getSingleUserAdmin.ts
│   │   │   │   ├── getUserEngagement.ts
│   │   │   │   ├── getUsers.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── removeFromBasket.ts
│   │   │   │   ├── updateUser.ts
│   │   │   │   └── viewBasket.ts
│   │   │   ├── index.ts
│   │   │   ├── server.ts
│   │   │   ├── services
│   │   │   │   └── model.service.ts
│   │   │   └── validations
│   │   │       └── index.ts
│   │   └── tsconfig.json
│   └── widget-management-service
│       ├── package.json
│       ├── src
│       │   ├── client.ts
│       │   ├── handlers
│       │   │   ├── addBanner.ts
│       │   │   ├── addProductSlider.ts
│       │   │   ├── addWidget.ts
│       │   │   ├── addWidgetSurvey.ts
│       │   │   ├── deleteBanner.ts
│       │   │   ├── deleteProductSlider.ts
│       │   │   ├── deleteWidget.ts
│       │   │   ├── deleteWidgetSurvey.ts
│       │   │   ├── findWidgetsBySample.ts
│       │   │   ├── getActiveLayout.ts
│       │   │   ├── getActiveWidget.ts
│       │   │   ├── getBanner.ts
│       │   │   ├── getProductSlider.ts
│       │   │   ├── getSingleWidget.ts
│       │   │   ├── getWidgets.ts
│       │   │   ├── index.ts
│       │   │   ├── publishWidget.ts
│       │   │   ├── removeSurveyFromWidget.ts
│       │   │   ├── saveAsDraft.ts
│       │   │   ├── toggleWidgetActivation.ts
│       │   │   ├── updateBanner.ts
│       │   │   ├── updateProductSlider.ts
│       │   │   └── updateWidgetSurvey.ts
│       │   ├── index.ts
│       │   ├── server.ts
│       │   ├── services
│       │   │   ├── client.service.ts
│       │   │   └── model.service.ts
│       │   └── validations
│       │       └── index.ts
│       └── tsconfig.json
├── commitlint.config.js
├── docker
│   └── base.Dockerfile
├── docker-compose.ci.yml
├── docker-compose.dev.yml
├── docker-compose.local.yml
├── docker-compose.prod.yml
├── env.example
├── package.json
├── packages
│   ├── common
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── apiResponse.ts
│   │   │   ├── asyncHandler.ts
│   │   │   ├── aws
│   │   │   │   ├── cloudFront.ts
│   │   │   │   ├── eventBridge.ts
│   │   │   │   ├── invokeLambda.ts
│   │   │   │   ├── s3-handler.ts
│   │   │   │   └── sns.ts
│   │   │   ├── bullMQ
│   │   │   │   ├── ai_agent.ts
│   │   │   │   ├── helper.ts
│   │   │   │   ├── queues.ts
│   │   │   │   └── worker
│   │   │   │       ├── imageScan.worker.ts
│   │   │   │       ├── index.ts
│   │   │   │       ├── matchProducts.worker.ts
│   │   │   │       ├── processFiles.worker.ts
│   │   │   │       └── storeS3.worker.ts
│   │   │   ├── constants.ts
│   │   │   ├── elastic
│   │   │   │   ├── config.ts
│   │   │   │   └── index.ts
│   │   │   ├── email
│   │   │   │   └── send-email.services.ts
│   │   │   ├── errorMessage.ts
│   │   │   ├── excel-sheet
│   │   │   │   ├── generateExcelSheet.ts
│   │   │   │   └── importExcel.ts
│   │   │   ├── hashFunctions.ts
│   │   │   ├── healthCheck.ts
│   │   │   ├── helper.ts
│   │   │   ├── index.ts
│   │   │   ├── redis
│   │   │   │   └── redis.ts
│   │   │   ├── responseMessage.ts
│   │   │   ├── responseStatus.ts
│   │   │   ├── tokenFunctions.ts
│   │   │   ├── types
│   │   │   │   ├── auth.types.ts
│   │   │   │   ├── catalogue.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── product.types.ts
│   │   │   │   ├── sample.types.ts
│   │   │   │   ├── survey.types.ts
│   │   │   │   └── user.types.ts
│   │   │   ├── validations
│   │   │   │   ├── auth.validation.ts
│   │   │   │   ├── catalogue.validation.ts
│   │   │   │   ├── notification.validation.ts
│   │   │   │   ├── product.validation.ts
│   │   │   │   ├── redis.validation.ts
│   │   │   │   ├── sample.validation.ts
│   │   │   │   ├── survey.validation.ts
│   │   │   │   ├── user.validation.ts
│   │   │   │   └── widget.validation.ts
│   │   │   └── validations.ts
│   │   └── tsconfig.json
│   ├── database
│   │   ├── package.json
│   │   ├── sql
│   │   │   └── seed-data.sql
│   │   ├── src
│   │   │   ├── client.ts
│   │   │   ├── index.ts
│   │   │   ├── migrations
│   │   │   │   ├── 20250102182837_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250103094245_
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250104053404_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250104194126_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250104195756_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250105150954_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250106144729_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250112183228_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250112183534_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250120054231_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250122080036_fixing_category_id
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250122103435_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250124064324_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250125191437_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250127100919_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250128094148_
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250131100631_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250131131346_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250206062213_changing_type_boolean_to_string
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250206080002_changing_boolean_to_string
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250211121154_
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250217064028_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250304093803_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250317080534_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250428073455_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250430094506_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250502091232_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250509060351_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250512085909_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250514063302_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250515121659_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250516095545_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250516100715_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250520073859_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250521072559_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250605125548_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250620062030_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250623112711_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250627051222_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250627120119_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250630073053_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20250702070655_initial
│   │   │   │   │   └── migration.sql
│   │   │   │   └── migration_lock.toml
│   │   │   ├── prisma
│   │   │   │   └── schema
│   │   │   │       ├── AdSuggestedBrand.prisma
│   │   │   │       ├── adSuggestedGroup.prisma
│   │   │   │       ├── adSuggestedProduct.prisma
│   │   │   │       ├── adminNotification.prisma
│   │   │   │       ├── advertisement.prisma
│   │   │   │       ├── advertisementImage.prisma
│   │   │   │       ├── advertisementItem.prisma
│   │   │   │       ├── banner.prisma
│   │   │   │       ├── basket.prisma
│   │   │   │       ├── basketItem.prisma
│   │   │   │       ├── brand.prisma
│   │   │   │       ├── category.prisma
│   │   │   │       ├── masterProduct.prisma
│   │   │   │       ├── matchSuggestion.prisma
│   │   │   │       ├── notification.prisma
│   │   │   │       ├── postcode.prisma
│   │   │   │       ├── preference.prisma
│   │   │   │       ├── priceAlert.prisma
│   │   │   │       ├── priceHistory.prisma
│   │   │   │       ├── productGroup.prisma
│   │   │   │       ├── productGroupProduct.prisma
│   │   │   │       ├── productSlider.prisma
│   │   │   │       ├── retailer.prisma
│   │   │   │       ├── retailerCurrentPricing.prisma
│   │   │   │       ├── sample.option.prisma
│   │   │   │       ├── sample.prisma
│   │   │   │       ├── sample.product.prisma
│   │   │   │       ├── sample.question.prisma
│   │   │   │       ├── sample.response.prisma
│   │   │   │       ├── sample.users.prisma
│   │   │   │       ├── sampleReview.prisma
│   │   │   │       ├── schema.prisma
│   │   │   │       ├── suggestionDetails.prisma
│   │   │   │       ├── supplier.prisma
│   │   │   │       ├── survey.option.prisma
│   │   │   │       ├── survey.prisma
│   │   │   │       ├── survey.question.prisma
│   │   │   │       ├── survey.response.prisma
│   │   │   │       ├── user.prisma
│   │   │   │       ├── userLoginActivity.prisma
│   │   │   │       ├── widget.prisma
│   │   │   │       └── widgetComponent.prisma
│   │   │   ├── seed.ts
│   │   │   └── utils
│   │   │       └── helper-queries.ts
│   │   └── tsconfig.json
│   ├── eslint-config
│   │   ├── README.md
│   │   ├── library.js
│   │   ├── next.js
│   │   ├── package.json
│   │   └── react-internal.js
│   ├── grpc-client
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── index.ts
│   │   │   ├── interceptors
│   │   │   │   └── logging.ts
│   │   │   ├── middleware
│   │   │   │   └── retry.ts
│   │   │   └── types
│   │   │       └── index.ts
│   │   └── tsconfig.json
│   ├── grpc-config
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── client-factory.ts
│   │   │   ├── index.ts
│   │   │   ├── proto-file.config.ts
│   │   │   ├── service-config.ts
│   │   │   ├── serviceDefinitions
│   │   │   │   ├── authServiceDefinition.ts
│   │   │   │   ├── catalogueServiceDefinition.ts
│   │   │   │   ├── healthServiceDefinition.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── notificationServiceDefinition.ts
│   │   │   │   ├── productServiceDefinition.ts
│   │   │   │   ├── sampleServiceDefinition.ts
│   │   │   │   ├── surveyServiceDefinition.ts
│   │   │   │   ├── userServiceDefinition.ts
│   │   │   │   └── widgetServiceDefinition.ts
│   │   │   └── types
│   │   │       └── index.ts
│   │   └── tsconfig.json
│   ├── grpc-server
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── base-server.ts
│   │   │   ├── error-handling
│   │   │   │   └── index.ts
│   │   │   ├── index.ts
│   │   │   └── middleware
│   │   │       ├── auth
│   │   │       │   └── index.ts
│   │   │       └── validation
│   │   │           └── index.ts
│   │   └── tsconfig.json
│   ├── logger
│   │   ├── package.json
│   │   ├── src
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   ├── proto-definition
│   │   ├── package.json
│   │   ├── proto-dev-gen.js
│   │   ├── src
│   │   │   ├── index.ts
│   │   │   └── proto
│   │   │       ├── auth
│   │   │       │   └── auth.proto
│   │   │       ├── catalogue
│   │   │       │   └── catalogue.proto
│   │   │       ├── chart
│   │   │       │   └── chart.proto
│   │   │       ├── health
│   │   │       │   └── health.proto
│   │   │       ├── notification
│   │   │       │   └── notification.proto
│   │   │       ├── product
│   │   │       │   └── product.proto
│   │   │       ├── sample
│   │   │       │   └── sample.proto
│   │   │       ├── survey
│   │   │       │   └── survey.proto
│   │   │       ├── user
│   │   │       │   └── user.proto
│   │   │       └── widget
│   │   │           └── widget.proto
│   │   └── tsconfig.json
│   └── typescript-config
│       ├── base.json
│       ├── nextjs.json
│       ├── package.json
│       └── react-library.json
├── patches
│   └── long@5.2.3.patch
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── scripts
│   └── check-branch.js
├── serverless
│   ├── .serverless
│   │   └── meta.json
│   ├── atc-admin-notification
│   │   ├── handler.js
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── serverless.yml
│   │   └── src
│   │       ├── adminNotification.js
│   │       ├── devDB.js
│   │       └── helper.js
│   ├── atc-lambda
│   │   ├── database
│   │   │   ├── devDB.js
│   │   │   └── rawDB.js
│   │   ├── handler.js
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── serverless.yml
│   │   └── src
│   │       ├── app.js
│   │       ├── dump.js
│   │       ├── helper.js
│   │       ├── routes.js
│   │       └── sync.js
│   ├── atc-price-alert
│   │   ├── handler.js
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── serverless.yml
│   │   └── src
│   │       ├── devDB.js
│   │       ├── helper.js
│   │       └── priceAlert.js
│   └── atc-publish-widget
│       ├── handler.js
│       ├── package-lock.json
│       ├── package.json
│       ├── serverless.yml
│       └── src
│           ├── devDB.js
│           └── publishWidget.js
└── turbo.json
