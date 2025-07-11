import {
    ProductDetailsResponse,
    getAllProductsResponse,
    getCategoryListResponse,
    getSubCategoriesResponse,
    ProductSearchResponse,
    getProductListResponse,
    getPotentialMatchListResponse,
    matchProductsResponse,
    addProductBySuggestionListResponse,
    addBrandResponse,
    addCategoryResponse,
    syncDataInElasticResponse,
    updateProductResponse,
    getProductListWithRetailerCodeResponse,
    getBrandListResponse,
    getRetailerListResponse,
    getAllCategoryListResponse,
    updateCategoryResponse,
    addRetailerResponse,
    NewProductListResponse,
    getProductByCategoryCountResponse,
    getProductByRetailerCountResponse,
    GetSampleEngagementResponse,
    ExportToExcelForRetailerListResponse,
    AddProductResponse,
    deleteCategoryResponse,
    deleteProductResponse,
    UpdateAdminProductResponse,
    CheckBarcodeExistenceResponse,
    AddBarcodeToRedisResponse,
    GetProductsForProductGroupResponse,
    AddSupplierResponse,
    GetSupplierListResponse,
    DefaultResponse,
} from '@atc/proto';
import { productStub } from '../client';
import {
    apiResponse,
    asyncHandler,
    errorMessage,
    KeyPrefixEnum,
    redisService,
    RESPONSE_STATUS,
    utilFns,
} from '@atc/common';
import { grpcToHttpStatus } from '@atc/common';
import { logger } from '@atc/logger';
import { status as grpcStatus } from '@grpc/grpc-js';

const productDetails = asyncHandler(async (req, res) => {
    const body = utilFns.removeEmptyFields(req.body);
    const metadata = utilFns.createMetadata(
        'authorization',
        req.headers.authorization,
    );

    const details: Promise<ProductDetailsResponse> = new Promise(
        (resolve, reject) => {
            productStub.ProductDetails(
                body,
                metadata,
                (err: any, response: any) => {
                    if (err) reject(err);
                    else resolve(response);
                },
            );
        },
    );

    const { status, ...resData } = await details;

    return apiResponse(res, grpcToHttpStatus(status), resData);
});

const getAllProducts = asyncHandler(async (req, res) => {
    try {
        const body = utilFns.removeEmptyFields(req.body);
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const allProducts: Promise<getAllProductsResponse> = new Promise(
            (resolve, reject) => {
                productStub.getAllProducts(
                    body,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await allProducts;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getProductList = asyncHandler(async (req, res) => {
    try {
        const body = utilFns.removeEmptyFields(req.body);
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const getProductList: Promise<getProductListResponse> = new Promise(
            (resolve, reject) => {
                productStub.getProductList(
                    body,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await getProductList;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getCategoryList = asyncHandler(async (req, res) => {
    try {
        const body = utilFns.removeEmptyFields(req.body);
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const queryKey = redisService.createKey(
            KeyPrefixEnum.CATEGORY_LIST,
            body,
        );

        const cachedData = await redisService.get(queryKey);

        if (cachedData) {
            const { status, ...resData } = cachedData;
            return apiResponse(res, grpcToHttpStatus(status), resData);
        }

        const categoryList: Promise<getCategoryListResponse> = new Promise(
            (resolve, reject) => {
                productStub.getCategoryList(
                    body,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await categoryList;

        redisService.set(queryKey, JSON.stringify({ status, ...resData }));

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getSubCategories = asyncHandler(async (req, res) => {
    try {
        const body = utilFns.removeEmptyFields(req.body);
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const queryKey = redisService.createKey(
            KeyPrefixEnum.SUB_CATEGORY_LIST,
            body,
        );

        const cachedData = await redisService.get(queryKey);

        if (cachedData) {
            const { status, ...resData } = cachedData;
            return apiResponse(res, grpcToHttpStatus(status), resData);
        }

        const subCategories: Promise<getSubCategoriesResponse> = new Promise(
            (resolve, reject) => {
                productStub.getSubCategories(
                    body,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await subCategories;

        redisService.set(queryKey, JSON.stringify({ status, ...resData }));

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const productSearch = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const productSearch: Promise<ProductSearchResponse> = new Promise(
            (resolve, reject) => {
                productStub.ProductSearch(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );
        const { status, ...resData } = await productSearch;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getPotentialMatchList = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const potentialMatchList: Promise<getPotentialMatchListResponse> =
            new Promise((resolve, reject) => {
                productStub.getPotentialMatchList(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await potentialMatchList;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const matchProducts = asyncHandler(async (req, res) => {
    try {
        const body = utilFns.removeEmptyFields(req.body);
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const matchProducts: Promise<matchProductsResponse> = new Promise(
            (resolve, reject) => {
                productStub.matchProducts(
                    body,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await matchProducts;

        if (status === grpcStatus.OK) {
            redisService.clearPattern(`${KeyPrefixEnum.PRODUCTS}:*`);
        }

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const addBrand = asyncHandler(async (req, res) => {
    try {
        const body = utilFns.removeEmptyFields(req.body);
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const addBrand: Promise<addBrandResponse> = new Promise(
            (resolve, reject) => {
                productStub.addBrand(
                    {
                        ...body,
                        image: req.file ? req.file.buffer : null,
                        mime_type: req.file ? req.file.mimetype : '',
                        content_length: req.file ? req.file.size : 0,
                    },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await addBrand;

        if (status === grpcStatus.OK) {
            redisService.clearPattern(`${KeyPrefixEnum.BRAND_LIST}:*`);
        }

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const addCategory = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const addCategory: Promise<addCategoryResponse> = new Promise(
            (resolve, reject) => {
                productStub.addCategory(
                    {
                        ...req.body,
                        ...req.params,
                        image: req.file ? req.file.buffer : null,
                        mime_type: req.file ? req.file.mimetype : '',
                        content_length: req.file ? req.file.size : 0,
                    },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await addCategory;

        if (status === grpcStatus.OK) {
            Promise.all([
                redisService.clearPattern(`${KeyPrefixEnum.CATEGORY_LIST}:*`),
                redisService.clearPattern(
                    `${KeyPrefixEnum.SUB_CATEGORY_LIST}:*`,
                ),
                redisService.clearPattern(
                    `${KeyPrefixEnum.ALL_CATEGORY_LIST}:*`,
                ),
            ]);
        }

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const addProductBySuggestionList = asyncHandler(async (req, res) => {
    try {
        const body = utilFns.removeEmptyFields(req.body);
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const addProductBySuggestionList: Promise<addProductBySuggestionListResponse> =
            new Promise((resolve, reject) => {
                productStub.addProductBySuggestionList(
                    {
                        ...body,
                        image: req.file ? req.file.buffer : null,
                        mime_type: req.file ? req.file.mimetype : '',
                        content_length: req.file ? req.file.size : 0,
                    },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await addProductBySuggestionList;

        if (status === grpcStatus.OK) {
            redisService.addMembersToSet(KeyPrefixEnum.BARCODE_LIST, [
                req.body.barcode,
            ]);
            redisService.clearPattern(`${KeyPrefixEnum.PRODUCTS}:*`);
        }

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const syncDataInElastic = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const syncDataInElastic: Promise<syncDataInElasticResponse> =
            new Promise((resolve, reject) => {
                productStub.syncDataInElastic(
                    {},
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await syncDataInElastic;
        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const updateProduct = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const updateProduct: Promise<updateProductResponse> = new Promise(
            (resolve, reject) => {
                productStub.updateProduct(
                    { ...req.params, ...req.body },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await updateProduct;

        if (status === grpcStatus.OK) {
            redisService.clearPattern(`${KeyPrefixEnum.PRODUCTS}:*`);
        }

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getProductListWithRetailerCode = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const getProductListWithRetailerCode: Promise<getProductListWithRetailerCodeResponse> =
            new Promise((resolve, reject) => {
                productStub.getProductListWithRetailerCode(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await getProductListWithRetailerCode;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getRetailerList = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const queryKey = redisService.createKey(
            KeyPrefixEnum.RETAILER_LIST,
            req.query,
        );

        const cachedData = await redisService.get(queryKey);

        if (cachedData) {
            const { status, ...resData } = cachedData;
            return apiResponse(res, grpcToHttpStatus(status), resData);
        }

        const getRetailerList: Promise<getRetailerListResponse> = new Promise(
            (resolve, reject) => {
                productStub.getRetailerList(
                    { ...req.query },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await getRetailerList;

        redisService.set(queryKey, JSON.stringify({ status, ...resData }));

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getBrandList = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const queryKey = redisService.createKey(
            KeyPrefixEnum.BRAND_LIST,
            req.query,
        );

        const cachedData = await redisService.get(queryKey);

        if (cachedData) {
            const { status, ...resData } = cachedData;
            return apiResponse(res, grpcToHttpStatus(status), resData);
        }

        const getBrandList: Promise<getBrandListResponse> = new Promise(
            (resolve, reject) => {
                productStub.getBrandList(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await getBrandList;

        redisService.set(queryKey, JSON.stringify({ status, ...resData }));

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getAllCategoryList = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const queryKey = redisService.createKey(
            KeyPrefixEnum.ALL_CATEGORY_LIST,
            req.query,
        );

        const cachedData = await redisService.get(queryKey);

        if (cachedData) {
            const { status, ...resData } = cachedData;
            return apiResponse(res, grpcToHttpStatus(status), resData);
        }

        const getAllCategoryList: Promise<getAllCategoryListResponse> =
            new Promise((resolve, reject) => {
                productStub.getAllCategoryList(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await getAllCategoryList;

        redisService.set(queryKey, JSON.stringify({ status, ...resData }));

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getNewProductList = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const getNewProductList: Promise<NewProductListResponse> = new Promise(
            (resolve, reject) => {
                productStub.getNewProductList(
                    {},
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await getNewProductList;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getProductByCategoryCount = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const getProductByCategoryCount: Promise<getProductByCategoryCountResponse> =
            new Promise((resolve, reject) => {
                productStub.getProductByCategoryCount(
                    {},
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await getProductByCategoryCount;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getProductByRetailerCount = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const getProductByRetailerCount: Promise<getProductByRetailerCountResponse> =
            new Promise((resolve, reject) => {
                productStub.getProductByRetailerCount(
                    {},
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await getProductByRetailerCount;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getProductEngagement = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const dashboard: Promise<GetSampleEngagementResponse> = new Promise(
            (resolve, reject) => {
                productStub.getProductEngagement(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await dashboard;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const exportToExcel = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const exportReport: Promise<ExportToExcelForRetailerListResponse> =
            new Promise((resolve, reject) => {
                productStub.ExportToExcel(
                    { ...req.params, ...req.query },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await exportReport;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const updateCategory = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const updateCategory: Promise<updateCategoryResponse> = new Promise(
            (resolve, reject) => {
                productStub.updateCategory(
                    {
                        ...req.body,
                        ...req.params,
                        image: req.file ? req.file.buffer : null,
                        mime_type: req.file ? req.file.mimetype : '',
                        content_length: req.file ? req.file.size : 0,
                    },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await updateCategory;

        if (status === grpcStatus.OK) {
            Promise.all([
                redisService.clearPattern(`${KeyPrefixEnum.CATEGORY_LIST}:*`),
                redisService.clearPattern(
                    `${KeyPrefixEnum.SUB_CATEGORY_LIST}:*`,
                ),
                redisService.clearPattern(
                    `${KeyPrefixEnum.ALL_CATEGORY_LIST}:*`,
                ),
            ]);
        }

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const addRetailer = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const addRetailer: Promise<addRetailerResponse> = new Promise(
            (resolve, reject) => {
                productStub.addRetailer(
                    {
                        ...req.body,
                        ...req.params,
                        image: req.file ? req.file.buffer : null,
                        mime_type: req.file ? req.file.mimetype : '',
                        content_length: req.file ? req.file.size : 0,
                    },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await addRetailer;

        if (status === grpcStatus.OK) {
            redisService.clearPattern(`${KeyPrefixEnum.RETAILER_LIST}:*`);
        }

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const updateRetailer = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const updateRetailer: Promise<addRetailerResponse> = new Promise(
            (resolve, reject) => {
                productStub.updateRetailer(
                    {
                        ...req.body,
                        ...req.params,
                        image: req.file ? req.file.buffer : null,
                        mime_type: req.file ? req.file.mimetype : '',
                        content_length: req.file ? req.file.size : 0,
                    },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await updateRetailer;

        if (status === grpcStatus.OK) {
            redisService.clearPattern(`${KeyPrefixEnum.RETAILER_LIST}:*`);
        }

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const addProduct = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        if (!req.file) {
            return apiResponse(res, RESPONSE_STATUS.BAD_REQUEST, {
                message: errorMessage.OTHER.IMAGE_REQUIRED,
            });
        }

        const product: Promise<AddProductResponse> = new Promise(
            (resolve, reject) => {
                productStub.AddProduct(
                    {
                        ...req.body,
                        image: req.file.buffer,
                        mime_type: req.file.mimetype,
                        content_length: req.file.size,
                    },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await product;

        if (status === grpcStatus.OK) {
            redisService.addMembersToSet(KeyPrefixEnum.BARCODE_LIST, [
                req.body.barcode,
            ]);
            redisService.clearPattern(`${KeyPrefixEnum.PRODUCTS}:*`);
        }

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const deleteCategory = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const deleteCategory: Promise<deleteCategoryResponse> = new Promise(
            (resolve, reject) => {
                productStub.deleteCategory(
                    { ...req.params },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await deleteCategory;

        if (status === grpcStatus.OK) {
            Promise.all([
                redisService.clearPattern(`${KeyPrefixEnum.CATEGORY_LIST}:*`),
                redisService.clearPattern(
                    `${KeyPrefixEnum.SUB_CATEGORY_LIST}:*`,
                ),
                redisService.clearPattern(
                    `${KeyPrefixEnum.ALL_CATEGORY_LIST}:*`,
                ),
            ]);
        }

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const deleteProduct = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const deleteProduct: Promise<deleteProductResponse> = new Promise(
            (resolve, reject) => {
                productStub.deleteProduct(
                    { ...req.params },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await deleteProduct;

        if (status === grpcStatus.OK) {
            redisService.clearPattern(`${KeyPrefixEnum.PRODUCTS}:*`);
        }

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const updateAdminProduct = asyncHandler(async (req, res) => {
    const metadata = utilFns.createMetadata(
        'authorization',
        req.headers.authorization,
    );

    const product: Promise<UpdateAdminProductResponse> = new Promise(
        (resolve, reject) => {
            productStub.UpdateAdminProduct(
                {
                    ...req.body,
                    ...req.params,
                    image: req.file ? req.file.buffer : null,
                    mime_type: req.file ? req.file.mimetype : '',
                    content_length: req.file ? req.file.size : 0,
                },
                metadata,
                (err: any, response: any) => {
                    if (err) reject(err);
                    else resolve(response);
                },
            );
        },
    );

    const { status, ...resData } = await product;

    if (status === grpcStatus.OK) {
        redisService.clearPattern(`${KeyPrefixEnum.PRODUCTS}:*`);
    }

    return apiResponse(res, grpcToHttpStatus(status), resData);
});

const checkBarcodeExistence = asyncHandler(async (req, res) => {
    const metadata = utilFns.createMetadata(
        'authorization',
        req.headers.authorization,
    );

    const barcode: Promise<CheckBarcodeExistenceResponse> = new Promise(
        (resolve, reject) => {
            productStub.CheckBarcodeExistence(
                req.query,
                metadata,
                (err: any, response: any) => {
                    if (err) reject(err);
                    else resolve(response);
                },
            );
        },
    );

    const { status, ...resData } = await barcode;

    return apiResponse(res, grpcToHttpStatus(status), resData);
});

const addBarcodeToRedis = asyncHandler(async (req, res) => {
    const metadata = utilFns.createMetadata(
        'authorization',
        req.headers.authorization,
    );

    const barcode: Promise<AddBarcodeToRedisResponse> = new Promise(
        (resolve, reject) => {
            productStub.AddBarcodeToRedis(
                {},
                metadata,
                (err: any, response: any) => {
                    if (err) reject(err);
                    else resolve(response);
                },
            );
        },
    );

    const { status, ...resData } = await barcode;

    return apiResponse(res, grpcToHttpStatus(status), resData);
});

const getProductsForProductGroup = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const response: Promise<GetProductsForProductGroupResponse> =
            new Promise((resolve, reject) => {
                productStub.GetProductsForProductGroup(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await response;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const updateBrand = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const response: Promise<addBrandResponse> = new Promise(
            (resolve, reject) => {
                productStub.UpdateBrand(
                    {
                        ...req.body,
                        ...req.params,
                        image: req.file ? req.file.buffer : null,
                        mime_type: req.file ? req.file.mimetype : '',
                        content_length: req.file ? req.file.size : 0,
                    },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await response;

        if (status === grpcStatus.OK) {
            redisService.clearPattern(`${KeyPrefixEnum.BRAND_LIST}:*`);
        }

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const addSupplier = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const response: Promise<AddSupplierResponse> = new Promise(
            (resolve, reject) => {
                productStub.AddSupplier(
                    {
                        ...req.body,
                        image: req.file ? req.file.buffer : null,
                        mime_type: req.file ? req.file.mimetype : '',
                        content_length: req.file ? req.file.size : 0,
                    },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await response;

        if (
            status === grpcStatus.OK &&
            req.body.brand_ids &&
            req.body.brand_ids.length > 0
        ) {
            redisService.clearPattern(`${KeyPrefixEnum.BRAND_LIST}:*`);
        }

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getSupplierList = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const response: Promise<GetSupplierListResponse> = new Promise(
            (resolve, reject) => {
                productStub.GetSupplierList(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await response;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const updateSupplier = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const response: Promise<AddSupplierResponse> = new Promise(
            (resolve, reject) => {
                productStub.UpdateSupplier(
                    {
                        ...req.params,
                        ...req.body,
                        image: req.file ? req.file.buffer : null,
                        mime_type: req.file ? req.file.mimetype : '',
                        content_length: req.file ? req.file.size : 0,
                    },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await response;

        if (
            status === grpcStatus.OK &&
            req.body.brand_ids &&
            req.body.brand_ids.length > 0
        ) {
            redisService.clearPattern(`${KeyPrefixEnum.BRAND_LIST}:*`);
        }

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const toggleIntervention = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const response: Promise<DefaultResponse> = new Promise(
            (resolve, reject) => {
                productStub.ToggleIntervention(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await response;

        if (status === grpcStatus.OK) {
            redisService.clearPattern(`${KeyPrefixEnum.BRAND_LIST}:*`);
        }

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const importExcelData = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        if (!req.file) {
            return apiResponse(res, RESPONSE_STATUS.BAD_REQUEST, {
                message: errorMessage.OTHER.FILE_REQUIRED,
            });
        }

        const response: Promise<DefaultResponse> = new Promise(
            (resolve, reject) => {
                productStub.ImportExcelData(
                    { file: req.file.buffer, ...req.params },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await response;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

export {
    productDetails,
    getAllProducts,
    getCategoryList,
    getSubCategories,
    addBrand,
    addCategory,
    getProductList,
    productSearch,
    getPotentialMatchList,
    matchProducts,
    addProductBySuggestionList,
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
};
