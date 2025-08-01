import {
    errorMessage,
    SortByField,
    SortByOrder,
    ChartType,
    constants,
    SortByFieldBrandList,
    ImportModel,
} from '@atc/common';
import { prismaClient } from '@atc/db';
import z from 'zod';
import { booleanFromStringSchema } from './sample.validation';

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
            .string()
            .refine((value) => {
                const parsed = parseInt(value);
                return !isNaN(parsed) && Number.isInteger(parsed);
            })
            .transform((value) => Math.trunc(parseInt(value)))
            .optional(),
        limit: z
            .string()
            .refine((value) => {
                const parsed = parseInt(value);
                return !isNaN(parsed) && Number.isInteger(parsed);
            })
            .transform((value) => Math.trunc(parseInt(value)))
            .optional(),
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

const getProductListWithRetailerCodeSchema = z.object({
    page: z
        .string()
        .refine((value) => {
            const parsed = parseInt(value);
            return !isNaN(parsed) && Number.isInteger(parsed);
        })
        .transform((value) => Math.trunc(parseInt(value)))
        .optional(),
    limit: z
        .string()
        .refine((value) => {
            const parsed = parseInt(value);
            return !isNaN(parsed) && Number.isInteger(parsed);
        })
        .transform((value) => Math.trunc(parseInt(value)))
        .optional(),
    keyword: z.string().trim().optional(),
    sort_by_order: z
        .nativeEnum(SortByOrder)
        .optional()
        .default(SortByOrder.ASC),
});

const getPotentialMatchListSchema = getProductListWithRetailerCodeSchema.extend(
    { intervention: z.enum(['true', 'false']).optional() },
);

const getSubCategoriesSchema = z.object({
    category_id: z.string().trim().uuid(),
});

const addBrandSchema = z
    .object({
        brand_name: z.string().trim().max(200),
        private_label: booleanFromStringSchema,
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
        barcode: z.string().trim(),
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

const productIDSchema = z
    .object({
        product_id: z.string().trim().uuid(),
    })
    .strict();

const addProductBySuggestionListSchema = z
    .object({
        product_id: z.string().trim().uuid(),
        product_name: z.string().trim(),
        barcode: z.string().trim(),
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
        size: z
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
        unit: z.nativeEnum(prismaClient.UnitEnum),
        configuration: z.string().trim().optional(),
        a2c_size: z.string().trim(),
    })
    .refine(
        (data) =>
            data.product_id ||
            data.product_name ||
            data.barcode ||
            data.retailer_id ||
            data.category_id ||
            data.brand_name ||
            data.pack_size,
        {
            message: errorMessage.PRODUCT.PROVIDE_VALID_PARAMETER_VALUE,
            path: [
                'product_id',
                'product_name',
                'barcode',
                'retailer_id',
                'category_id',
                'brand_name',
                'pack_size',
            ],
        },
    );

const getRetailerListSchema = z.object({
    keyword: z.string().trim().optional(),
    sort_by_order: z
        .nativeEnum(SortByOrder)
        .optional()
        .default(SortByOrder.ASC),
});

const GetProductEngagementSchema = z
    .object({
        type: z.nativeEnum(ChartType),
    })
    .strict();

const ExportToExcelSchema = z.object({
    email: z.string().trim().email(),
    keyword: z.string().trim().optional(),
    sort_by_order: z
        .nativeEnum(SortByOrder)
        .optional()
        .default(SortByOrder.ASC),
});

const GetRetailerListSchema = z.object({
    keyword: z.string().trim().optional(),
    sort_by_order: z
        .nativeEnum(SortByOrder)
        .optional()
        .default(SortByOrder.ASC),
    page: z
        .string()
        .refine((value) => {
            const parsed = parseInt(value);
            return !isNaN(parsed) && Number.isInteger(parsed);
        })
        .transform((value) => Math.trunc(parseInt(value)))
        .optional(),
    limit: z
        .string()
        .refine((value) => {
            const parsed = parseInt(value);
            return !isNaN(parsed) && Number.isInteger(parsed);
        })
        .transform((value) => Math.trunc(parseInt(value)))
        .optional(),
});

const updateRetailerSchema = z.object({
    retailer_name: z.string().trim(),
    image: z.instanceof(Buffer).optional(),
    mime_type: z
        .string()
        .regex(constants.MIME_TYPE_REGEX, errorMessage.OTHER.INVALID_MIME_TYPE)
        .optional(),
    content_length: z.number().optional(),
});

const addProductSchema = z.object({
    product_name: z.string().trim(),
    barcode: z.string().trim(),
    brand_id: z.string().uuid(),
    category_id: z.string().uuid(),
    pack_size: z.string().trim(),
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
    size: z
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
    unit: z.nativeEnum(prismaClient.UnitEnum),
    configuration: z.string().trim().optional(),
    a2c_size: z.string().trim(),
    retailer_details: z
        .array(
            z.object({
                retailer_id: z.string().uuid(),
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

const updateAdminProductSchema = addProductSchema.partial();

const CheckBarcodeExistenceSchema = z.object({
    barcode: z.string().trim().max(50),
});

const getProductsForProductGroupSchema = z
    .object({
        page: z
            .string()
            .refine((value) => {
                const parsed = parseInt(value);
                return !isNaN(parsed) && Number.isInteger(parsed);
            })
            .transform((value) => Math.trunc(parseInt(value))),
        limit: z
            .string()
            .refine((value) => {
                const parsed = parseInt(value);
                return !isNaN(parsed) && Number.isInteger(parsed);
            })
            .transform((value) => Math.trunc(parseInt(value))),
        keyword: z.string().trim().optional(),
        brand_ids: z
            .preprocess((val) => {
                if (typeof val === 'string') {
                    return val.split(',').map((id) => id.trim());
                }
                return val;
            }, z.array(z.string().uuid()))
            .optional(),
        category_ids: z
            .preprocess((val) => {
                if (typeof val === 'string') {
                    return val.split(',').map((id) => id.trim());
                }
                return val;
            }, z.array(z.string().uuid()))
            .optional(),
        size: z.string().trim().optional(),
        barcode: z.string().trim().optional(),
        min_price: z.preprocess((val) => {
            if (typeof val === 'string') {
                return parseFloat(val);
            }
            return val;
        }, z.number().optional()),
        max_price: z.preprocess((val) => {
            if (typeof val === 'string') {
                return parseFloat(val);
            }
            return val;
        }, z.number().positive().optional()),
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

const updateBandSchema = z.object({
    brand_name: z.string().trim().max(200).optional(),
    private_label: booleanFromStringSchema,
    supplier_id: z.string().trim().uuid().optional(),
});

const brandIDSchema = z.object({
    brand_id: z.string().trim().uuid(),
});

const addSupplierSchema = z.object({
    supplier_name: z.string().trim().max(50),
    brand_ids: z.array(z.string().trim().uuid()).optional(),
});

const getSupplierListSchema = z.object({
    page: z
        .string()
        .refine((value) => {
            const parsed = parseInt(value);
            return !isNaN(parsed) && Number.isInteger(parsed);
        })
        .transform((value) => Math.trunc(parseInt(value))),
    limit: z
        .string()
        .refine((value) => {
            const parsed = parseInt(value);
            return !isNaN(parsed) && Number.isInteger(parsed);
        })
        .transform((value) => Math.trunc(parseInt(value))),
    keyword: z.string().trim().optional(),
    sort_by_order: z
        .nativeEnum(SortByOrder)
        .optional()
        .default(SortByOrder.ASC),
});

const supplierIDSchema = z.object({
    supplier_id: z.string().trim().uuid(),
});

const updateSupplierSchema = addSupplierSchema.partial();

const getBrandListSchema = z.object({
    page: z
        .string()
        .refine((value) => {
            const parsed = parseInt(value);
            return !isNaN(parsed) && Number.isInteger(parsed);
        })
        .transform((value) => Math.trunc(parseInt(value))),
    limit: z
        .string()
        .refine((value) => {
            const parsed = parseInt(value);
            return !isNaN(parsed) && Number.isInteger(parsed);
        })
        .transform((value) => Math.trunc(parseInt(value))),
    keyword: z.string().trim().optional(),
    sort_by_order: z
        .nativeEnum(SortByOrder)
        .optional()
        .default(SortByOrder.ASC),
    sort_by_field: z
        .nativeEnum(SortByFieldBrandList)
        .optional()
        .default(SortByFieldBrandList.BRAND_NAME),
});

const suggestionIDSchema = z.object({
    suggestion_id: z.string().trim().uuid(),
});

const masterProductExcelSchema = z
    .object({
        data: z.array(
            z.object({
                product_name: z.string().trim(),
                barcode: z.string().trim(),
                brand_name: z.string().trim(),
                category_hierarchy: z.string().trim(),
                pack_size: z.string().trim(),
                rrp: z
                    .string()
                    .refine(
                        (value) => {
                            const parsed = parseFloat(value);
                            return !isNaN(parsed) && parsed >= 0;
                        },
                        { message: 'Price must be a valid number.' },
                    )
                    .transform((value) => parseFloat(value)),
                image_url: z.string().trim().url().optional(),
            }),
        ),
    })
    .superRefine((obj, ctx) => {
        const seen = new Set<string>();
        for (const [i, item] of obj.data.entries()) {
            const barcode = item.barcode.trim();
            if (seen.has(barcode)) {
                ctx.addIssue({
                    path: ['data', i, 'barcode'],
                    code: z.ZodIssueCode.custom,
                    message: 'Barcode must be unique',
                });
            }
            seen.add(barcode);
        }
    });

const productRetailerExcelSchema = z.object({
    data: z.array(
        z.object({
            barcode: z.string().trim(),
            retailer_name: z.string().trim(),
            price: z
                .string()
                .refine(
                    (value) => {
                        const parsed = parseFloat(value);
                        return !isNaN(parsed) && parsed >= 0;
                    },
                    { message: 'Price must be a valid number.' },
                )
                .transform((value) => parseFloat(value)),
            retailer_code: z.string().trim().default(''),
            per_unit_price: z.string().trim().default(''),
            offer_info: z.string().trim().optional().default(''),
            product_url: z.string().trim().url().default('').optional(),
            promotion_type: z
                .nativeEnum(prismaClient.PromotionTypeEnum)
                .default(prismaClient.PromotionTypeEnum.RETAILER),
        }),
    ),
});

const retailerExcelSchema = z.object({
    data: z.array(
        z.object({
            retailer_name: z.string().trim(),
            site_url: z.string().trim().url().optional(),
        }),
    ),
});

const supplierExcelSchema = z.object({
    data: z.array(
        z.object({
            supplier_name: z.string().trim(),
            brand_names: z
                .string()
                .optional()
                .transform((val) => {
                    if (typeof val === 'string') {
                        return val
                            .split(',')
                            .map((b) => b.trim())
                            .filter(Boolean);
                    }
                    return val ?? [];
                }),
        }),
    ),
});

const brandExcelSchema = z.object({
    data: z.array(
        z.object({
            brand_name: z.string().trim(),
            private_label: booleanFromStringSchema,
            supplier_name: z.string().trim().optional(),
        }),
    ),
});

const categoryExcelSchema = z.object({
    data: z.array(
        z.object({
            category_hierarchy: z.string().trim(),
        }),
    ),
});

export {
    getProductDetailsSchema,
    getAllProductsSchema,
    getCategoryListSchema,
    getSubCategoriesSchema,
    addBrandSchema,
    addCategorySchema,
    updateProductSchema,
    productIDSchema,
    getProductListWithRetailerCodeSchema,
    addProductBySuggestionListSchema,
    getRetailerListSchema,
    GetProductEngagementSchema,
    ExportToExcelSchema,
    GetRetailerListSchema,
    updateRetailerSchema,
    addProductSchema,
    updateAdminProductSchema,
    CheckBarcodeExistenceSchema,
    getProductsForProductGroupSchema,
    updateBandSchema,
    brandIDSchema,
    addSupplierSchema,
    getSupplierListSchema,
    supplierIDSchema,
    updateSupplierSchema,
    getBrandListSchema,
    suggestionIDSchema,
    getPotentialMatchListSchema,
    masterProductExcelSchema,
    productRetailerExcelSchema,
    retailerExcelSchema,
    supplierExcelSchema,
    brandExcelSchema,
    categoryExcelSchema,
};
