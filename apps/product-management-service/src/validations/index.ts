import {
    constants,
    errorMessage,
    ExcelReportType,
    ImportModel,
    SortByField,
    SortByFieldBrandList,
    SortByOrder,
} from '@atc/common';
import { prismaClient } from '@atc/db';
import z from 'zod';

const getProductDetailsSchema = z
    .object({
        id: z.string().trim().uuid().optional(),
        barcode: z.string().trim().optional(),
    })
    .refine((data) => data.id || data.barcode, {
        message: errorMessage.PRODUCT.ID_OR_BARCODE_REQUIRED,
        path: ['id', 'barcode'],
    });

const getAllProductsSchema = z
    .object({
        product_ids: z.array(z.string().trim().uuid()).optional(),
        brand_ids: z.array(z.string().trim().uuid()).optional(),
        promotion_type: z.nativeEnum(prismaClient.PromotionTypeEnum).optional(),
        retailer_ids: z.array(z.string().trim().uuid()).optional(),
        category_ids: z.array(z.string().trim().uuid()).optional(),
        sort_by_field: z.nativeEnum(SortByField).optional(),
        sort_by_order: z
            .nativeEnum(SortByOrder)
            .optional()
            .default(SortByOrder.ASC),
        page: z
            .number()
            .int()
            .positive()
            .transform((value) => Math.trunc(value))
            .default(1),
        limit: z
            .number()
            .int()
            .positive()
            .transform((value) => Math.trunc(value))
            .default(5),
    })
    .refine(
        (data) =>
            data.product_ids?.length ||
            data.brand_ids?.length ||
            data.promotion_type ||
            data.retailer_ids?.length ||
            data.category_ids?.length || {
                message: errorMessage.PRODUCT.PROVIDE_AT_LEAST_ONE_PARAMETER,
                path: [
                    'product_ids',
                    'brand_ids',
                    'promotion_type',
                    'retailer_ids',
                    'category_ids',
                ],
            },
    );

const getProductListSchema = z
    .object({
        user_id: z.string().trim().uuid().optional(),
        product_ids: z.array(z.string().trim().uuid()).optional(),
        brand_ids: z.array(z.string().trim().uuid()).optional(),
        promotion_type: z.nativeEnum(prismaClient.PromotionTypeEnum).optional(),
        retailer_ids: z.array(z.string().trim().uuid()).optional(),
        category_id: z.string().trim().uuid().optional(),
        sort_by_field: z.nativeEnum(SortByField).optional(),
        sort_by_order: z
            .nativeEnum(SortByOrder)
            .optional()
            .default(SortByOrder.ASC),
        page: z
            .number()
            .int()
            .positive()
            .transform((value) => Math.trunc(value))
            .default(1),
        limit: z
            .number()
            .int()
            .positive()
            .transform((value) => Math.trunc(value))
            .default(5),
    })
    .refine(
        (data) =>
            data.product_ids?.length ||
            data.brand_ids?.length ||
            data.promotion_type ||
            data.retailer_ids?.length ||
            data.category_id || {
                message: errorMessage.PRODUCT.PROVIDE_AT_LEAST_ONE_PARAMETER,
                path: [
                    'product_ids',
                    'brand_ids',
                    'promotion_type',
                    'retailer_ids',
                    'category_id',
                ],
            },
    );

const getCategoryListSchema = z
    .object({
        page: z
            .number()
            .int()
            .positive()
            .transform((value) => Math.trunc(value))
            .default(1),
        limit: z
            .number()
            .int()
            .positive()
            .transform((value) => Math.trunc(value))
            .default(5),
        keyword: z.string().trim().optional(),
        sort_by_order: z
            .nativeEnum(SortByOrder)
            .optional()
            .default(SortByOrder.ASC),
    })
    .refine((data) => data.keyword || data.page || data.limit, {
        message: errorMessage.PRODUCT.PROVIDE_AT_LEAST_ONE_PARAMETER,
        path: ['keyword', 'page', 'limit', 'sort_by_order'],
    });

const getSubCategoriesSchema = z.object({
    category_id: z.string().trim().uuid(),
});

const productSearchSchema = z
    .object({
        keyword: z.string().trim().min(3).max(30),
        page: z
            .number()
            .int()
            .positive()
            .transform((value) => Math.trunc(value))
            .default(1),
        limit: z
            .number()
            .int()
            .positive()
            .transform((value) => Math.trunc(value))
            .default(10),
    })
    .refine((data) => data.keyword, {
        message: errorMessage.PRODUCT.INCREASE_KEYWORD,
        path: ['keyword'],
    });

const matchProductsSchema = z
    .object({
        product_to_match_id: z.string().trim().uuid(),
        potential_match_id: z.string().trim().uuid(),
    })
    .refine((data) => data.product_to_match_id || data.potential_match_id, {
        message: errorMessage.PRODUCT.PROVIDE_VALID_PARAMETER_VALUE,
        path: ['product_to_match_id', 'potential_match_id'],
    });

const addProductBySuggestionListSchema = z
    .object({
        product_id: z.string().trim().uuid(),
        product_name: z.string().trim(),
        barcode: z.string().trim().max(50),
        retailer_id: z.string().trim().uuid(),
        category_id: z.string().trim().uuid(),
        brand_name: z.string().trim(),
        pack_size: z.string().trim(),
        image_url: z.string().trim().url().optional(),
        retailer_code: z.string().trim().default(''),
        price: z
            .string()
            .refine(
                (value) => {
                    const parsed = parseFloat(value);
                    return !isNaN(parsed) && parsed >= 0;
                },
                {
                    message: 'Price must be a valid number.',
                },
            )
            .transform((value) => parseFloat(value)),
        per_unit_price: z.string().trim().optional().default(''),
        offer_info: z.string().trim().optional().default(''),
        promotion_type: z
            .nativeEnum(prismaClient.PromotionTypeEnum)
            .default(prismaClient.PromotionTypeEnum.RETAILER)
            .optional(),
        product_url: z.string().trim().default('').optional(),
        rrp: z
            .string()
            .refine(
                (value) => {
                    const parsed = parseFloat(value);
                    return !isNaN(parsed) && parsed >= 0;
                },
                {
                    message: 'Price must be a valid number.',
                },
            )
            .transform((value) => parseFloat(value)),
        image: z.instanceof(Buffer).optional(),
        mime_type: z
            .string()
            .regex(
                constants.MIME_TYPE_REGEX,
                errorMessage.OTHER.INVALID_MIME_TYPE,
            )
            .optional(),
        content_length: z.number().optional(),
        size: z.number().positive(),
        unit: z.nativeEnum(prismaClient.UnitEnum),
        configuration: z.string().trim().optional(),
        a2c_size: z.string().trim(),
    })
    .refine(
        (data) =>
            data.product_name ||
            data.barcode ||
            data.retailer_id ||
            data.category_id ||
            data.brand_name ||
            data.pack_size,
        {
            message: errorMessage.PRODUCT.PROVIDE_VALID_PARAMETER_VALUE,
            path: [
                'product_name',
                'barcode',
                'retailer_id',
                'category_id',
                'brand_name',
                'pack_size',
            ],
        },
    )
    .refine((data) => data.image || data.image_url, {
        message: errorMessage.PRODUCT.EITHER_IMAGE_OR_IMAGE_URL,
        path: ['image', 'image_url'],
    });

const addBrandSchema = z
    .object({
        brand_name: z.string().trim().max(200),
        private_label: z.boolean().default(false),
        image: z.instanceof(Buffer).optional(),
        mime_type: z
            .string()
            .regex(
                constants.MIME_TYPE_REGEX,
                errorMessage.OTHER.INVALID_MIME_TYPE,
            )
            .optional(),
        content_length: z.number().optional(),
        supplier_id: z.string().trim().uuid().optional(),
    })
    .refine((data) => data.brand_name, {
        message: errorMessage.PRODUCT.BRAND_NAME_REQUIRED,
        path: ['brand_name'],
    });

const addCategorySchema = z
    .object({
        category_name: z.string().trim().max(50),
        parent_category_id: z.string().trim().uuid().optional(),
        image: z.instanceof(Buffer).optional(),
        mime_type: z
            .string()
            .regex(
                constants.MIME_TYPE_REGEX,
                errorMessage.OTHER.INVALID_MIME_TYPE,
            )
            .optional(),
        content_length: z.number().optional(),
    })
    .refine((data) => data.category_name, {
        message: errorMessage.PRODUCT.CATEGORY_NAME_REQUIRED,
        path: ['category_name'],
    });

const updateProductSchema = z
    .object({
        product_id: z.string().trim().uuid(),
        barcode: z.string().trim().max(50),
        product_name: z.string().trim().optional(),
        category_id: z.string().trim().uuid().optional(),
        brand_id: z.string().trim().uuid().optional(),
        pack_size: z.string().trim().optional(),
        promotion_type: z.nativeEnum(prismaClient.PromotionTypeEnum).optional(),
        size: z.number().optional(),
        unit: z.nativeEnum(prismaClient.UnitEnum).optional(),
        configuration: z.string().trim().optional(),
        a2c_size: z.string().trim().optional(),
    })
    .refine((data) => data.barcode, {
        message: errorMessage.PRODUCT.PROVIDE_VALID_PARAMETER_VALUE,
        path: ['barcode'],
    });

const getRetailerListSchema = z.object({
    keyword: z.string().trim().optional(),
    sort_by_order: z
        .nativeEnum(SortByOrder)
        .optional()
        .default(SortByOrder.ASC),
    page: z
        .number()
        .int()
        .transform((value) => Math.trunc(value))
        .optional(),
    limit: z
        .number()
        .int()
        .transform((value) => Math.trunc(value))
        .optional(),
});

const ExportToExcelSchema = z.object({
    email: z.string().trim().email(),
    keyword: z.string().trim().optional(),
    sort_by_order: z
        .nativeEnum(SortByOrder)
        .optional()
        .default(SortByOrder.ASC),
    type: z.nativeEnum(ExcelReportType),
});

const updateCategorySchema = z.object({
    category_id: z.string().trim().uuid(),
    image: z.instanceof(Buffer).optional(),
    category_name: z.string().trim(),
    parent_category_id: z.string().trim().uuid().optional(),
    mime_type: z
        .string()
        .regex(constants.MIME_TYPE_REGEX, errorMessage.OTHER.INVALID_MIME_TYPE)
        .optional(),
    content_length: z.number().optional(),
});

const updateRetailerSchema = z.object({
    id: z.string().trim().uuid(),
    retailer_name: z.string().trim(),
    image: z.instanceof(Buffer).optional(),
    mime_type: z
        .string()
        .regex(constants.MIME_TYPE_REGEX, errorMessage.OTHER.INVALID_MIME_TYPE)
        .optional(),
    content_length: z.number().optional(),
});

const addRetailerSchema = z.object({
    retailer_name: z.string().trim(),
    image: z.instanceof(Buffer).optional(),
    mime_type: z
        .string()
        .regex(constants.MIME_TYPE_REGEX, errorMessage.OTHER.INVALID_MIME_TYPE)
        .optional(),
    content_length: z.number().optional(),
});

const addProductSchema = z.object({
    image: z.instanceof(Buffer),
    mime_type: z
        .string()
        .regex(constants.MIME_TYPE_REGEX, errorMessage.OTHER.INVALID_MIME_TYPE)
        .optional(),
    content_length: z.number().optional(),
    product_name: z.string().trim(),
    barcode: z.string().trim(),
    brand_id: z.string().uuid(),
    category_id: z.string().uuid(),
    pack_size: z.string().trim(),
    rrp: z.number().positive(),
    size: z.number().positive(),
    unit: z.nativeEnum(prismaClient.UnitEnum),
    configuration: z.string().trim().optional(),
    a2c_size: z.string().trim(),
    retailer_details: z
        .array(
            z.object({
                retailer_id: z.string().uuid(),
                price: z.number().positive(),
                retailer_code: z.string().trim().default(''),
                per_unit_price: z.string().trim().default(''),
                offer_info: z.string().trim().optional().default(''),
                product_url: z.string().trim().url().default('').optional(),
                promotion_type: z
                    .nativeEnum(prismaClient.PromotionTypeEnum)
                    .default(prismaClient.PromotionTypeEnum.RETAILER),
            }),
        )
        .refine(
            (retailers) =>
                new Set(retailers.map((r) => r.retailer_id)).size ===
                retailers.length,
            {
                message: 'Retailer IDs must be unique',
                path: ['retailer_details'],
            },
        ),
});

const productIDSchema = z.object({
    product_id: z.string().trim().uuid(),
});

const updateAdminProductSchema = addProductSchema.partial().extend({
    product_id: z.string().trim().uuid(),
});

const CheckBarcodeExistenceSchema = z.object({
    barcode: z.string().trim().max(50),
});

const getProductByIDsSchema = z.object({
    product_ids: z.array(z.string().trim().uuid()),
});

const getProductsForProductGroupSchema = z
    .object({
        page: z
            .number()
            .int()
            .transform((value) => Math.trunc(value)),
        limit: z
            .number()
            .int()
            .transform((value) => Math.trunc(value)),
        keyword: z.string().trim().optional(),
        brand_ids: z.array(z.string().trim().uuid()).optional(),
        category_ids: z.array(z.string().trim().uuid()).optional(),
        size: z.string().trim().optional(),
        barcode: z.string().trim().optional(),
        min_price: z.number().optional(),
        max_price: z.number().optional(),
        group_id: z.string().trim().uuid().optional(),
    })
    .superRefine((data, ctx) => {
        const min = data.min_price;
        const max = data.max_price;

        const isMinDefined = min !== undefined;
        const isMaxDefined = max !== undefined;

        if (
            (isMinDefined && !isMaxDefined) ||
            (!isMinDefined && isMaxDefined)
        ) {
            ctx.addIssue({
                path: ['max_price'],
                code: z.ZodIssueCode.custom,
                message: errorMessage.PRODUCT.MIN_AND_MAX_BOTH_REQUIRED,
            });
        }

        if (isMinDefined && isMaxDefined && min > max) {
            ctx.addIssue({
                path: ['max_price'],
                code: z.ZodIssueCode.custom,
                message: errorMessage.PRODUCT.MIN_PRICE_GREATER_THAN_MAX_PRICE,
            });
        }
    });

const updateBrandSchema = z.object({
    brand_id: z.string().trim().uuid(),
    brand_name: z.string().trim().max(200).optional(),
    private_label: z.boolean().optional(),
    image: z.instanceof(Buffer).optional(),
    mime_type: z
        .string()
        .regex(constants.MIME_TYPE_REGEX, errorMessage.OTHER.INVALID_MIME_TYPE)
        .optional(),
    content_length: z.number().optional(),
    supplier_id: z.string().trim().uuid().optional(),
});

const addSupplierSchema = z
    .object({
        supplier_name: z.string().trim(),
        brand_ids: z.array(z.string().trim().uuid()).optional(),
        image: z.instanceof(Buffer).optional(),
        mime_type: z
            .string()
            .regex(
                constants.MIME_TYPE_REGEX,
                errorMessage.OTHER.INVALID_MIME_TYPE,
            )
            .optional(),
        content_length: z.number().optional(),
    })
    .strict();

const getSupplierListSchema = z
    .object({
        page: z
            .number()
            .int()
            .transform((value) => Math.trunc(value)),
        limit: z
            .number()
            .int()
            .transform((value) => Math.trunc(value)),
        keyword: z.string().trim().optional(),
        sort_by_order: z
            .nativeEnum(SortByOrder)
            .optional()
            .default(SortByOrder.ASC),
    })
    .strict();

const updateSupplierSchema = addSupplierSchema.partial().extend({
    supplier_id: z.string().trim().uuid(),
});

const getBrandListSchema = z
    .object({
        page: z
            .number()
            .int()
            .transform((value) => Math.trunc(value)),
        limit: z
            .number()
            .int()
            .transform((value) => Math.trunc(value)),
        keyword: z.string().trim().optional(),
        sort_by_order: z
            .nativeEnum(SortByOrder)
            .optional()
            .default(SortByOrder.ASC),
        sort_by_field: z
            .nativeEnum(SortByFieldBrandList)
            .optional()
            .default(SortByFieldBrandList.BRAND_NAME),
    })
    .strict();

const getPotentialMatchListSchema = z
    .object({
        page: z
            .number()
            .int()
            .positive()
            .transform((value) => Math.trunc(value))
            .default(1),
        limit: z
            .number()
            .int()
            .positive()
            .transform((value) => Math.trunc(value))
            .default(5),
        keyword: z.string().trim().optional(),
        sort_by_order: z
            .nativeEnum(SortByOrder)
            .optional()
            .default(SortByOrder.ASC),
        intervention: z.enum(['true', 'false']).optional(),
    })
    .strict();

const importExcelDataSchema = z.object({
    file: z.instanceof(Buffer),
    model: z.nativeEnum(ImportModel),
});

type updateProductType = z.infer<typeof updateProductSchema>;
type ExportToExcelType = z.infer<typeof ExportToExcelSchema>;
type addProductType = z.infer<typeof addProductSchema>;
type updateAdminProductType = z.infer<typeof updateAdminProductSchema>;
type CheckBarcodeExistenceType = z.infer<typeof CheckBarcodeExistenceSchema>;
type getProductsForProductGroupType = z.infer<
    typeof getProductsForProductGroupSchema
>;
type addBrandType = z.infer<typeof addBrandSchema>;
type updateBrandType = z.infer<typeof updateBrandSchema>;
type addSupplierType = z.infer<typeof addSupplierSchema>;
type getSupplierListType = z.infer<typeof getSupplierListSchema>;
type updateSupplierType = z.infer<typeof updateSupplierSchema>;
type getBrandListType = z.infer<typeof getBrandListSchema>;
type importExcelDataType = z.infer<typeof importExcelDataSchema>;

export {
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
    productIDSchema,
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
};

export type {
    updateProductType,
    ExportToExcelType,
    addProductType,
    updateAdminProductType,
    CheckBarcodeExistenceType,
    getProductsForProductGroupType,
    addBrandType,
    updateBrandType,
    addSupplierType,
    getSupplierListType,
    updateSupplierType,
    getBrandListType,
    importExcelDataType,
};
