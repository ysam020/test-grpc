import { ProductServiceHandlers } from '@atc/proto';
import { productDetails } from './productDetails';
import { getAllProductsHandler } from './getAllProducts';
import { getCategoryListHandler } from './getCategoryList';
import { getSubCategoriesHandler } from './getSubCategories';
import { productSearchHandler } from './productSearch';
import { getProductListHandler } from './getProductListHandler';
import { getPotentialMatchListHandler } from './getPotentialMatchList';
import { matchProductsHandler } from './matchProduct';
import { addProductBySuggestionListHandler } from './addProductFromSuggestion';
import { addBrandHandler } from './addBrand';
import { addCategoryHandler } from './addCategory';
import { syncDataInElasticHandler } from './syncDataInElastic';
import { updateProductHandler } from './updateProduct';
import { getProductListWithRetailerCodeHandler } from './getProductListWithRetailerCode';
import { getRetailerListHandler } from './getRetailerList';
import { getBrandListHandler } from './getBrandList';
import { getAllCategoryListHandler } from './getAllCategoryList';
import { getProductsCountHandler } from './getProductsCount';
import { getNewProductListHandler } from './getNewProductList';
import { getProductByCategoryCountHandler } from './getProductByCategoryCount';
import { getProductByRetailerCountHandler } from './getProductByRetailerCount';
import { getProductEngagementHandler } from './getProductEngagement';
import { ExportToExcel } from './exportToExcel';
import { updateCategoryHandler } from './updateCategory';
import { addRetailerHandler } from './addRetailer';
import { updateRetailerHandler } from './updateRetailer';
import { addProduct } from './addProduct';
import { deleteCategoryHandler } from './deleteCategory';
import { deleteProductHandler } from './deleteProduct';
import { updateAdminProduct } from './updateAdminProduct';
import { checkBarcodeExistence } from './checkBarcodeExistence';
import { addBarcodeToRedis } from './addBarcodeToRedis';
import { getProductByIDs } from './getProductByIDs';
import { getProductsForProductGroup } from './getProductsForProductGroup';
import { updateBrandHandler } from './updateBrand';
import { addSupplier } from './addSupplier';
import { getSupplierList } from './getSupplierList';
import { updateSupplier } from './updateSupplier';
import { toggleIntervention } from './toggleIntervention';
import { importExcelData } from './importExcelData';

export const handlers: ProductServiceHandlers = {
    ProductDetails: productDetails,
    getAllProducts: getAllProductsHandler,
    getCategoryList: getCategoryListHandler,
    getSubCategories: getSubCategoriesHandler,
    ProductSearch: productSearchHandler,
    getProductList: getProductListHandler,
    getPotentialMatchList: getPotentialMatchListHandler,
    matchProducts: matchProductsHandler,
    addProductBySuggestionList: addProductBySuggestionListHandler,
    addBrand: addBrandHandler,
    addCategory: addCategoryHandler,
    syncDataInElastic: syncDataInElasticHandler,
    updateProduct: updateProductHandler,
    getProductListWithRetailerCode: getProductListWithRetailerCodeHandler,
    getRetailerList: getRetailerListHandler,
    getBrandList: getBrandListHandler,
    getAllCategoryList: getAllCategoryListHandler,
    getProductsCount: getProductsCountHandler,
    getNewProductList: getNewProductListHandler,
    getProductByCategoryCount: getProductByCategoryCountHandler,
    getProductByRetailerCount: getProductByRetailerCountHandler,
    getProductEngagement: getProductEngagementHandler,
    ExportToExcel: ExportToExcel,
    updateCategory: updateCategoryHandler,
    addRetailer: addRetailerHandler,
    updateRetailer: updateRetailerHandler,
    AddProduct: addProduct,
    deleteCategory: deleteCategoryHandler,
    deleteProduct: deleteProductHandler,
    UpdateAdminProduct: updateAdminProduct,
    CheckBarcodeExistence: checkBarcodeExistence,
    AddBarcodeToRedis: addBarcodeToRedis,
    GetProductByIDs: getProductByIDs,
    GetProductsForProductGroup: getProductsForProductGroup,
    UpdateBrand: updateBrandHandler,
    AddSupplier: addSupplier,
    GetSupplierList: getSupplierList,
    UpdateSupplier: updateSupplier,
    ToggleIntervention: toggleIntervention,
    ImportExcelData: importExcelData,
};
