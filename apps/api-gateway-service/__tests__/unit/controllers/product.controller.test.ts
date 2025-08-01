import * as ProductController from '../../../src/controllers/product.controller';
import { productStub } from '../../../src/client';

jest.mock('@atc/common', () => ({
    apiResponse: jest.fn((res, status, data) =>
        res.status(status).json({ success: true, data }),
    ),
    asyncHandler: (fn) => fn,
    grpcToHttpStatus: jest.fn(() => 200),
    utilFns: {
        createMetadata: jest.fn(() => 'mockMeta'),
        convertCamelToSnake: jest.fn((data) => data),
        removeEmptyFields: jest.fn((data) => data),
    },
    redisService: {
        createKey: jest.fn(() => 'mockKey'),
        get: jest.fn(() => null), // Return null to bypass cache
        set: jest.fn(),
        clearPattern: jest.fn(),
        addMembersToSet: jest.fn(),
    },
    KeyPrefixEnum: {
        CATEGORY_LIST: 'category_list',
        SUB_CATEGORY_LIST: 'sub_category_list',
        ALL_CATEGORY_LIST: 'all_category_list',
        RETAILER_LIST: 'retailer_list',
        BRAND_LIST: 'brand_list',
        PRODUCTS: 'products',
        BARCODE_LIST: 'barcode_list',
    },
    RESPONSE_STATUS: {
        BAD_REQUEST: 400,
    },
    errorMessage: {
        OTHER: {
            IMAGE_REQUIRED: 'Image is required',
            FILE_REQUIRED: 'File is required',
        },
    },
}));

jest.mock('@atc/logger', () => ({
    logger: { error: jest.fn() },
}));

jest.mock('@grpc/grpc-js', () => ({
    status: {
        OK: 0,
    },
}));

jest.mock('../../../src/client', () => ({
    productStub: {
        ProductDetails: jest.fn(),
        getAllProducts: jest.fn(),
        getCategoryList: jest.fn(),
        getSubCategories: jest.fn(),
        ProductSearch: jest.fn(),
        getProductList: jest.fn(),
        getPotentialMatchList: jest.fn(),
        matchProducts: jest.fn(),
        addProductBySuggestionList: jest.fn(),
        addBrand: jest.fn(),
        addCategory: jest.fn(),
        syncDataInElastic: jest.fn(),
        updateProduct: jest.fn(),
        getProductListWithRetailerCode: jest.fn(),
        getRetailerList: jest.fn(),
        getBrandList: jest.fn(),
        getAllCategoryList: jest.fn(),
        getProductsCount: jest.fn(),
        getNewProductList: jest.fn(),
        getProductByCategoryCount: jest.fn(),
        getProductByRetailerCount: jest.fn(),
        getProductEngagement: jest.fn(),
        ExportToExcel: jest.fn(),
        updateCategory: jest.fn(),
        addRetailer: jest.fn(),
        updateRetailer: jest.fn(),
        AddProduct: jest.fn(),
        deleteCategory: jest.fn(),
        deleteProduct: jest.fn(),
        UpdateAdminProduct: jest.fn(),
        CheckBarcodeExistence: jest.fn(),
        AddBarcodeToRedis: jest.fn(),
        GetProductsForProductGroup: jest.fn(),
        UpdateBrand: jest.fn(),
        AddSupplier: jest.fn(),
        GetSupplierList: jest.fn(),
        UpdateSupplier: jest.fn(),
        ToggleIntervention: jest.fn(),
        ImportExcelData: jest.fn(),
    },
}));

const mockRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

const setupGrpcMock = (fnName, response) => {
    productStub[fnName].mockImplementation((_req, _meta, cb) =>
        cb(null, response),
    );
};

describe('Product Controller', () => {
    afterEach(() => jest.clearAllMocks());

    const testCases = [
        // Functions that actually call gRPC methods
        ['productDetails', 'ProductDetails', { productId: '1' }, 'body'],
        ['getAllProducts', 'getAllProducts', { page: 1, limit: 10 }, 'body'],
        ['getCategoryList', 'getCategoryList', { page: 1, limit: 10 }, 'body'],
        ['getSubCategories', 'getSubCategories', { categoryId: '1' }, 'body'],
        ['productSearch', 'ProductSearch', { keyword: 'test' }, 'query'],
        ['getProductList', 'getProductList', { page: 1, limit: 10 }, 'body'],
        [
            'getPotentialMatchList',
            'getPotentialMatchList',
            { productId: '1' },
            'query',
        ],
        [
            'matchProducts',
            'matchProducts',
            { productId: '1', matchId: '2' },
            'body',
        ],
        [
            'addProductBySuggestionList',
            'addProductBySuggestionList',
            { productId: '1', barcode: '123' },
            'body+file',
        ],
        ['addBrand', 'addBrand', { name: 'Nike' }, 'body+file'],
        [
            'addCategory',
            'addCategory',
            { name: 'Electronics' },
            'body+params+file',
        ],
        ['syncDataInElastic', 'syncDataInElastic', {}, 'empty'],
        [
            'updateProduct',
            'updateProduct',
            { id: '1', name: 'Updated Product' },
            'params+body',
        ],
        [
            'getProductListWithRetailerCode',
            'getProductListWithRetailerCode',
            { retailerCode: 'RET1' },
            'query',
        ],
        ['getRetailerList', 'getRetailerList', { page: 1, limit: 10 }, 'query'],
        ['getBrandList', 'getBrandList', { page: 1, limit: 10 }, 'query'],
        [
            'getAllCategoryList',
            'getAllCategoryList',
            { page: 1, limit: 10 },
            'query',
        ],
        ['getNewProductList', 'getNewProductList', {}, 'empty'],
        ['getProductByCategoryCount', 'getProductByCategoryCount', {}, 'empty'],
        ['getProductByRetailerCount', 'getProductByRetailerCount', {}, 'empty'],
        [
            'getProductEngagement',
            'getProductEngagement',
            { type: 'monthly' },
            'query',
        ],
        [
            'exportToExcel',
            'ExportToExcel',
            { type: 'products' },
            'params+query',
        ],
        [
            'updateCategory',
            'updateCategory',
            { id: '1', name: 'Updated Category' },
            'body+params+file',
        ],
        ['addRetailer', 'addRetailer', { name: 'Amazon' }, 'body+params+file'],
        [
            'updateRetailer',
            'updateRetailer',
            { id: '1', name: 'Updated Retailer' },
            'body+params+file',
        ],
        [
            'addProduct',
            'AddProduct',
            { name: 'iPhone', categoryId: '1', barcode: '123' },
            'body+file',
        ],
        ['deleteCategory', 'deleteCategory', { category_id: '1' }, 'params'],
        ['deleteProduct', 'deleteProduct', { id: '1' }, 'params'],
        [
            'updateAdminProduct',
            'UpdateAdminProduct',
            { product_id: '1', name: 'iPhone 15' },
            'body+params+file',
        ],
        [
            'checkBarcodeExistence',
            'CheckBarcodeExistence',
            { barcode: '123456789' },
            'query',
        ],
        ['addBarcodeToRedis', 'AddBarcodeToRedis', {}, 'empty'],
        [
            'getProductsForProductGroup',
            'GetProductsForProductGroup',
            { groupId: '1' },
            'query',
        ],
        [
            'updateBrand',
            'UpdateBrand',
            { id: '1', name: 'Updated Brand' },
            'body+params+file',
        ],
        [
            'addSupplier',
            'AddSupplier',
            { name: 'Supplier Inc', brand_ids: ['1'] },
            'body+file',
        ],
        ['getSupplierList', 'GetSupplierList', { page: 1, limit: 10 }, 'query'],
        [
            'updateSupplier',
            'UpdateSupplier',
            { supplier_id: '1', name: 'Updated Supplier', brand_ids: ['1'] },
            'params+body+file',
        ],
        [
            'toggleIntervention',
            'ToggleIntervention',
            { suggestion_id: '1' },
            'params',
        ],
        [
            'importExcelData',
            'ImportExcelData',
            { model: 'products' },
            'params+file',
        ],
    ];

    testCases.forEach(([fnName, grpcFn, payload, source]) => {
        it(`${fnName} should call ${grpcFn} and respond`, async () => {
            const res = mockRes();
            const req: any = { headers: { authorization: 'Bearer xyz' } };

            if (source === 'body') {
                req.body = payload;
            } else if (source === 'params') {
                req.params = payload;
            } else if (source === 'query') {
                req.query = payload;
            } else if (source === 'empty') {
                // No additional setup needed
            } else if (source === 'body+file') {
                req.body = payload;
                req.file = {
                    buffer: Buffer.from('test'),
                    mimetype: 'image/png',
                    size: 1024,
                };
            } else if (source === 'body+params') {
                req.body = { ...payload };
                req.params = { id: payload.id };
            } else if (source === 'params+body') {
                req.params = { id: payload.id };
                req.body = payload;
            } else if (source === 'body+params+file') {
                req.body = { ...payload };
                req.params = { id: payload.id };
                req.file = {
                    buffer: Buffer.from('test'),
                    mimetype: 'image/png',
                    size: 1024,
                };
            } else if (source === 'params+query') {
                req.params = { id: payload.id };
                req.query = payload;
            } else if (source === 'params+file') {
                req.params = payload;
                req.file = {
                    buffer: Buffer.from('test'),
                    mimetype:
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    size: 1024,
                };
            } else if (source === 'params+body+file') {
                req.params = { supplier_id: payload.supplier_id };
                req.body = payload;
                req.file = {
                    buffer: Buffer.from('test'),
                    mimetype: 'image/png',
                    size: 1024,
                };
            }

            setupGrpcMock(grpcFn, { status: 'SUCCESS', result: 'ok' });

            await ProductController[fnName](req, res);

            expect(productStub[grpcFn]).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
