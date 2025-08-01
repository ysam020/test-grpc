import { Router } from 'express';
import {
    productDetails,
    getAllProducts,
    getCategoryList,
    getSubCategories,
    productSearch,
    getProductList,
    getPotentialMatchList,
    matchProducts,
    addProductBySuggestionList,
    addBrand,
    addCategory,
    syncDataInElastic,
    updateProduct,
    getProductListWithRetailerCode,
    getRetailerList,
    getBrandList,
    getAllCategoryList,
    getNewProductList,
    getProductByCategoryCount,
    getProductByRetailerCount,
    getProductEngagement,
    exportToExcel,
    updateCategory,
    addRetailer,
    updateRetailer,
    addProduct,
    deleteCategory,
    deleteProduct,
    updateAdminProduct,
    checkBarcodeExistence,
    addBarcodeToRedis,
    getProductsForProductGroup,
    updateBrand,
    addSupplier,
    getSupplierList,
    updateSupplier,
    toggleIntervention,
    importExcelData,
} from '../controllers/product.controller';
import { validateData } from '../middlewares/validation.middleware';
import { productValidation, UUIDSchema, ExportTypeSchema } from '@atc/common';
import {
    uploadExcelFile,
    uploadFile,
} from '../middlewares/uploadFile.middleware';

const productRouter = Router();

productRouter.post(
    '/',
    uploadFile,
    validateData(productValidation.addProductSchema),
    addProduct,
);

productRouter.post(
    '/product-details',
    validateData(productValidation.getProductDetailsSchema),
    productDetails,
);

productRouter.get(
    '/barcode',
    validateData(undefined, productValidation.CheckBarcodeExistenceSchema),
    checkBarcodeExistence,
);

productRouter.post('/barcode', addBarcodeToRedis);

productRouter.post(
    '/get-all-products',
    validateData(productValidation.getAllProductsSchema),
    getAllProducts,
);

productRouter.post(
    '/get-category-list',
    validateData(productValidation.getCategoryListSchema),
    getCategoryList,
);

productRouter.post(
    '/get-sub-categories',
    validateData(productValidation.getSubCategoriesSchema),
    getSubCategories,
);

productRouter.get('/product-search', productSearch);

productRouter.post('/get-product-list', getProductList);

productRouter.get(
    '/get-potential-match-list',
    validateData(undefined, productValidation.getPotentialMatchListSchema),
    getPotentialMatchList,
);

productRouter.post('/match-products', matchProducts);

productRouter.post(
    '/add-product-by-suggestion-list',
    uploadFile,
    validateData(productValidation.addProductBySuggestionListSchema),
    addProductBySuggestionList,
);

productRouter.post(
    '/add-brand',
    uploadFile,
    validateData(productValidation.addBrandSchema),
    addBrand,
);

productRouter.put(
    '/update-brand/:brand_id',
    uploadFile,
    validateData(
        productValidation.updateBandSchema,
        undefined,
        productValidation.brandIDSchema,
    ),
    updateBrand,
);

productRouter.post(
    '/add-category',
    uploadFile,
    validateData(productValidation.addCategorySchema),
    addCategory,
);

productRouter.get('/sync-data-in-elastic', syncDataInElastic);

productRouter.put(
    '/update-product/:product_id',
    validateData(
        productValidation.updateProductSchema,
        undefined,
        productValidation.productIDSchema,
    ),
    updateProduct,
);

productRouter.get(
    '/get-product-list-with-retailer-code',
    validateData(
        undefined,
        productValidation.getProductListWithRetailerCodeSchema,
    ),
    getProductListWithRetailerCode,
);

productRouter.get(
    '/get-retailer-list',
    validateData(undefined, productValidation.GetRetailerListSchema),
    getRetailerList,
);

productRouter.get(
    '/get-brand-list',
    validateData(undefined, productValidation.getBrandListSchema),
    getBrandList,
);

productRouter.get(
    '/get-all-category-list',
    validateData(
        undefined,
        productValidation.getProductListWithRetailerCodeSchema,
    ),
    getAllCategoryList,
);

productRouter.get('/get-new-product-list', getNewProductList);

productRouter.get('/get-product-by-category-count', getProductByCategoryCount);

productRouter.get('/get-product-by-retailer-count', getProductByRetailerCount);

productRouter.get(
    '/dashboard',
    validateData(undefined, productValidation.GetProductEngagementSchema),
    getProductEngagement,
);

productRouter.get(
    '/export-excel/:type',
    validateData(
        undefined,
        productValidation.ExportToExcelSchema,
        ExportTypeSchema,
    ),
    exportToExcel,
);

productRouter.post(
    '/add-category',
    uploadFile,
    validateData(productValidation.addCategorySchema),
    addCategory,
);

productRouter.put(
    '/update-category/:category_id',
    uploadFile,
    validateData(
        productValidation.addCategorySchema,
        undefined,
        productValidation.getSubCategoriesSchema,
    ),
    updateCategory,
);

productRouter.post(
    '/add-retailer',
    uploadFile,
    validateData(productValidation.updateRetailerSchema),
    addRetailer,
);

productRouter.put(
    '/update-retailer/:id',
    uploadFile,
    validateData(productValidation.updateRetailerSchema, undefined, UUIDSchema),
    updateRetailer,
);

productRouter.delete(
    '/delete-category/:category_id',
    validateData(
        undefined,
        undefined,
        productValidation.getSubCategoriesSchema,
    ),
    deleteCategory,
);

productRouter.delete(
    '/delete-product/:id',
    validateData(undefined, undefined, UUIDSchema),
    deleteProduct,
);

productRouter.put(
    '/:product_id',
    uploadFile,
    validateData(
        productValidation.updateAdminProductSchema,
        undefined,
        productValidation.productIDSchema,
    ),
    updateAdminProduct,
);

productRouter.get(
    '/product-group',
    validateData(undefined, productValidation.getProductsForProductGroupSchema),
    getProductsForProductGroup,
);

productRouter.post(
    '/supplier',
    uploadFile,
    validateData(productValidation.addSupplierSchema),
    addSupplier,
);

productRouter.get(
    '/supplier',
    validateData(undefined, productValidation.getSupplierListSchema),
    getSupplierList,
);

productRouter.put(
    '/supplier/:supplier_id',
    uploadFile,
    validateData(
        productValidation.updateSupplierSchema,
        undefined,
        productValidation.supplierIDSchema,
    ),
    updateSupplier,
);

productRouter.put(
    '/toggle-intervention/:suggestion_id',
    validateData(undefined, undefined, productValidation.suggestionIDSchema),
    toggleIntervention,
);

productRouter.post('/import-data/:model', uploadExcelFile, importExcelData);

export { productRouter };
