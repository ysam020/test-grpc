import { serviceDefinitions } from '@atc/grpc-config';

import {
    authMiddleware,
    BaseGrpcServer,
    roleMiddleware,
} from '@atc/grpc-server';
import {
    HealthCheckResponse,
    _health_ServiceStatus_ServingStatus as ServingStatus,
} from '@atc/proto';
import {
    getProductDetailsSchema,
    getAllProductsSchema,
    getCategoryListSchema,
    getSubCategoriesSchema,
    productSearchSchema,
    getProductListSchema,
    matchProductsSchema,
    addProductBySuggestionListSchema,
    addBrandSchema,
    addCategorySchema,
    updateProductSchema,
    getRetailerListSchema,
    ExportToExcelSchema,
    updateCategorySchema,
    addRetailerSchema,
    updateRetailerSchema,
    addProductSchema,
    updateAdminProductSchema,
    CheckBarcodeExistenceSchema,
    getProductByIDsSchema,
    getProductsForProductGroupSchema,
    updateBrandSchema,
    addSupplierSchema,
    getSupplierListSchema,
    updateSupplierSchema,
    getBrandListSchema,
    getPotentialMatchListSchema,
    importExcelDataSchema,
} from './validations';
import * as grpc from '@grpc/grpc-js';
import {
    healthCheck,
    productValidation,
    UserRoleEnum,
    UUIDSchema,
} from '@atc/common';
import { handlers } from './handlers';

export class ProductServer extends BaseGrpcServer {
    constructor() {
        super();
        this.initializeServer();
    }

    private initializeServer() {
        this.addMiddleware(
            authMiddleware(
                [
                    '/health.HealthService/healthCheck',
                    '/product.ProductService/getCategoryList',
                    '/product.ProductService/getSubCategories',
                    '/product.ProductService/ProductSearch',
                    '/product.ProductService/getBrandList',
                ],
                [
                    '/product.ProductService/getAllProducts',
                    '/product.ProductService/ProductDetails',
                    '/product.ProductService/getProductList',
                ],
            ),
        );

        const roleRequirements = {
            '/product.ProductService/getProductEngagement': [
                UserRoleEnum.ADMIN,
            ],
            '/product.ProductService/getProductsCount': [UserRoleEnum.ADMIN],
            '/product.ProductService/getNewProductList': [UserRoleEnum.ADMIN],
            '/product.ProductService/getProductByCategoryCount': [
                UserRoleEnum.ADMIN,
            ],
            '/product.ProductService/getProductByRetailerCount': [
                UserRoleEnum.ADMIN,
            ],
            '/product.ProductService/ExportToExcel': [UserRoleEnum.ADMIN],
            '/product.ProductService/AddProduct': [UserRoleEnum.ADMIN],
            '/product.ProductService/deleteCategory': [UserRoleEnum.ADMIN],
            '/product.ProductService/deleteProduct': [UserRoleEnum.ADMIN],
            '/product.ProductService/getPotentialMatchList': [
                UserRoleEnum.ADMIN,
            ],
            '/product.ProductService/matchProducts': [UserRoleEnum.ADMIN],
            '/product.ProductService/addProductBySuggestionList': [
                UserRoleEnum.ADMIN,
            ],
            '/product.ProductService/addBrand': [UserRoleEnum.ADMIN],
            '/product.ProductService/addCategory': [UserRoleEnum.ADMIN],
            '/product.ProductService/addRetailer': [UserRoleEnum.ADMIN],
            '/product.ProductService/updateProduct': [UserRoleEnum.ADMIN],
            '/product.ProductService/updateCategory': [UserRoleEnum.ADMIN],
            '/product.ProductService/updateRetailer': [UserRoleEnum.ADMIN],
            '/product.ProductService/UpdateAdminProduct': [UserRoleEnum.ADMIN],
            '/product.ProductService/CheckBarcodeExistence': [
                UserRoleEnum.ADMIN,
            ],
            '/product.ProductService/AddBarcodeToRedis': [UserRoleEnum.ADMIN],
            '/product.ProductService/GetProductByIDs': [UserRoleEnum.ADMIN],
            '/product.ProductService/GetProductsForProductGroup': [
                UserRoleEnum.ADMIN,
            ],
            '/product.ProductService/UpdateBrand': [UserRoleEnum.ADMIN],
            '/product.ProductService/AddSupplier': [UserRoleEnum.ADMIN],
            '/product.ProductService/GetSupplierList': [UserRoleEnum.ADMIN],
            '/product.ProductService/UpdateSupplier': [UserRoleEnum.ADMIN],
            '/product.ProductService/ToggleIntervention': [UserRoleEnum.ADMIN],
        };

        this.addMiddleware(roleMiddleware(roleRequirements));

        this.addService(
            serviceDefinitions.productPackageDefinition.product.ProductService
                .service,
            {
                ...handlers,
                ProductDetails: this.wrapWithValidation(
                    handlers.ProductDetails,
                    getProductDetailsSchema,
                ),
                getAllProducts: this.wrapWithValidation(
                    handlers.getAllProducts,
                    getAllProductsSchema,
                ),
                getCategoryList: this.wrapWithValidation(
                    handlers.getCategoryList,
                    getCategoryListSchema,
                ),
                getSubCategories: this.wrapWithValidation(
                    handlers.getSubCategories,
                    getSubCategoriesSchema,
                ),
                ProductSearch: this.wrapWithValidation(
                    handlers.ProductSearch,
                    productSearchSchema,
                ),
                getProductList: this.wrapWithValidation(
                    handlers.getProductList,
                    getProductListSchema,
                ),
                getPotentialMatchList: this.wrapWithValidation(
                    handlers.getPotentialMatchList,
                    getPotentialMatchListSchema,
                ),
                matchProducts: this.wrapWithValidation(
                    handlers.matchProducts,
                    matchProductsSchema,
                ),
                addProductBySuggestionList: this.wrapWithValidation(
                    handlers.addProductBySuggestionList,
                    addProductBySuggestionListSchema,
                ),
                addBrand: this.wrapWithValidation(
                    handlers.addBrand,
                    addBrandSchema,
                ),
                addCategory: this.wrapWithValidation(
                    handlers.addCategory,
                    addCategorySchema,
                ),
                updateProduct: this.wrapWithValidation(
                    handlers.updateProduct,
                    updateProductSchema,
                ),
                getRetailerList: this.wrapWithValidation(
                    handlers.getRetailerList,
                    getRetailerListSchema,
                ),
                getProductEngagement: this.wrapWithValidation(
                    handlers.getProductEngagement,
                    productValidation.GetProductEngagementSchema,
                ),
                ExportToExcel: this.wrapWithValidation(
                    handlers.ExportToExcel,
                    ExportToExcelSchema,
                ),
                updateCategory: this.wrapWithValidation(
                    handlers.updateCategory,
                    updateCategorySchema,
                ),
                addRetailer: this.wrapWithValidation(
                    handlers.addRetailer,
                    addRetailerSchema,
                ),
                updateRetailer: this.wrapWithValidation(
                    handlers.updateRetailer,
                    updateRetailerSchema,
                ),
                AddProduct: this.wrapWithValidation(
                    handlers.AddProduct,
                    addProductSchema,
                ),
                deleteCategory: this.wrapWithValidation(
                    handlers.deleteCategory,
                    getSubCategoriesSchema,
                ),
                deleteProduct: this.wrapWithValidation(
                    handlers.deleteProduct,
                    UUIDSchema,
                ),
                UpdateAdminProduct: this.wrapWithValidation(
                    handlers.UpdateAdminProduct,
                    updateAdminProductSchema,
                ),
                CheckBarcodeExistence: this.wrapWithValidation(
                    handlers.CheckBarcodeExistence,
                    CheckBarcodeExistenceSchema,
                ),
                GetProductByIDs: this.wrapWithValidation(
                    handlers.GetProductByIDs,
                    getProductByIDsSchema,
                ),
                GetProductsForProductGroup: this.wrapWithValidation(
                    handlers.GetProductsForProductGroup,
                    getProductsForProductGroupSchema,
                ),
                UpdateBrand: this.wrapWithValidation(
                    handlers.UpdateBrand,
                    updateBrandSchema,
                ),
                AddSupplier: this.wrapWithValidation(
                    handlers.AddSupplier,
                    addSupplierSchema,
                ),
                GetSupplierList: this.wrapWithValidation(
                    handlers.GetSupplierList,
                    getSupplierListSchema,
                ),
                UpdateSupplier: this.wrapWithValidation(
                    handlers.UpdateSupplier,
                    updateSupplierSchema,
                ),
                getBrandList: this.wrapWithValidation(
                    handlers.getBrandList,
                    getBrandListSchema,
                ),
                ToggleIntervention: this.wrapWithValidation(
                    handlers.ToggleIntervention,
                    productValidation.suggestionIDSchema,
                ),
                ImportExcelData: this.wrapWithValidation(
                    handlers.ImportExcelData,
                    importExcelDataSchema,
                ),
            },
        ),
            this.addService(
                serviceDefinitions.healthPackageDefinition.health.HealthService
                    .service,
                {
                    healthCheck,
                },
            );
    }

    private healthCheckHandler = (
        call: grpc.ServerUnaryCall<any, HealthCheckResponse>,
        callback: grpc.sendUnaryData<HealthCheckResponse>,
    ) => {
        const services = [
            {
                service_name: 'ProductServer',
                status: ServingStatus.SERVING,
            },
        ];
        callback(null, { services });
    };
}
