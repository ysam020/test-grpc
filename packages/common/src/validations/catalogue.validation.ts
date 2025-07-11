import { prismaClient } from '@atc/db';
import z from 'zod';
import { errorMessage } from '../errorMessage';
import { AdItemMatchType, constants, ProductMatch } from '@atc/common';

const productGroupIDSchema = z
    .object({
        group_id: z.string().trim().uuid(),
    })
    .strict();

const advertisementIDSchema = z
    .object({
        advertisement_id: z.string().trim().uuid(),
    })
    .strict();

const advertisementItemIDSchema = z
    .object({
        ad_item_id: z.string().trim().uuid(),
    })
    .strict();

const createProductGroupSchema = z
    .object({
        group_name: z.string().trim().min(1).max(150),
        brand_ids: z.array(z.string().uuid()).optional(),
        type: z.nativeEnum(prismaClient.ProductGroupTypeEnum),
    })
    .strict();

const updateProductGroupSchema = createProductGroupSchema.partial();

const attachProductToGroupSchema = z
    .object({
        product_ids: z.array(z.string().trim().uuid()),
    })
    .superRefine((data, ctx) => {
        if (data.product_ids.length === 0) {
            ctx.addIssue({
                path: ['product_ids'],
                code: z.ZodIssueCode.custom,
                message: errorMessage.PRODUCT_GROUP.PRODUCT_IDS_REQUIRED,
            });
        }

        const uniqueProductIDs = new Set(data.product_ids);
        if (uniqueProductIDs.size !== data.product_ids.length) {
            ctx.addIssue({
                path: ['product_ids'],
                code: z.ZodIssueCode.custom,
                message: errorMessage.PRODUCT_GROUP.PRODUCT_IDS_UNIQUE,
            });
        }
    });

const getAllProductGroupsSchema = z
    .object({
        keyword: z.string().trim().optional(),
        brand_id: z.string().uuid().optional(),
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
    })
    .strict();

const removeProductsFromGroupSchema = z
    .object({
        product_ids: z.array(z.string().trim().uuid()),
    })
    .strict()
    .superRefine((data, ctx) => {
        if (data.product_ids.length === 0) {
            ctx.addIssue({
                path: ['product_ids'],
                code: z.ZodIssueCode.custom,
                message: errorMessage.PRODUCT_GROUP.PRODUCT_IDS_REQUIRED,
            });
        }
    });

const createAdvertisementSchema = z
    .object({
        title: z.string().trim(),
        keyword: z.string().trim().max(50).optional(),
        retailer_id: z.string().trim().uuid(),
        advertisement_type: z.nativeEnum(prismaClient.AdvertisementType),
        start_date: z
            .string()
            .trim()
            .regex(
                constants.DATE_REGEX,
                errorMessage.WIDGET.INVALID_DATE_FORMAT,
            ),
        end_date: z
            .string()
            .trim()
            .regex(
                constants.DATE_REGEX,
                errorMessage.WIDGET.INVALID_DATE_FORMAT,
            ),
    })
    .superRefine((data, ctx) => {
        if (data.start_date && data.end_date) {
            if (
                new Date(data.end_date).setHours(0, 0, 0, 0) <
                new Date(data.start_date).setHours(0, 0, 0, 0)
            ) {
                return ctx.addIssue({
                    path: ['end_date'],
                    message: errorMessage.DATE.DATE_BEFORE_START,
                    code: z.ZodIssueCode.custom,
                });
            }
        }
    });

const getAdvertisementsSchema = z.object({
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
    retailer_id: z.string().trim().uuid().optional(),
    advertisement_type: z.nativeEnum(prismaClient.AdvertisementType).optional(),
    year: z.preprocess((val) => {
        if (typeof val === 'string') {
            return parseInt(val);
        }
        return val;
    }, z.number().int().optional()),
    month: z.preprocess((val) => {
        if (typeof val === 'string') {
            return parseInt(val);
        }
        return val;
    }, z.number().int().min(1).max(12).optional()),
    product_match: z.nativeEnum(ProductMatch).optional(),
    keyword: z.string().trim().optional(),
});

const getSingleAdvertisementSchema = z.object({
    page: z
        .string()
        .refine((value) => {
            const parsed = parseInt(value);
            return !isNaN(parsed) && Number.isInteger(parsed);
        })
        .transform((value) => Math.trunc(parseInt(value))),
});

const updateAdvertisementSchema = z
    .object({
        title: z.string().trim().optional(),
        keyword: z.string().trim().max(50).optional(),
        retailer_id: z.string().trim().uuid().optional(),
        advertisement_type: z
            .nativeEnum(prismaClient.AdvertisementType)
            .optional(),
        start_date: z
            .string()
            .trim()
            .regex(
                constants.DATE_REGEX,
                errorMessage.WIDGET.INVALID_DATE_FORMAT,
            )
            .optional(),
        end_date: z
            .string()
            .trim()
            .regex(
                constants.DATE_REGEX,
                errorMessage.WIDGET.INVALID_DATE_FORMAT,
            )
            .optional(),
    })
    .superRefine((data, ctx) => {
        if (data.start_date && data.end_date) {
            if (
                new Date(data.end_date).setHours(0, 0, 0, 0) <
                new Date(data.start_date).setHours(0, 0, 0, 0)
            ) {
                return ctx.addIssue({
                    path: ['end_date'],
                    message: errorMessage.DATE.DATE_BEFORE_START,
                    code: z.ZodIssueCode.custom,
                });
            }
        }
    });

const exportToExcelAdvertisementsSchema = z.object({
    email: z.string().trim().email(),
    retailer_id: z.string().trim().uuid().optional(),
    advertisement_type: z.nativeEnum(prismaClient.AdvertisementType).optional(),
    year: z.preprocess((val) => {
        if (typeof val === 'string') {
            return parseInt(val);
        }
        return val;
    }, z.number().int().optional()),
    month: z.preprocess((val) => {
        if (typeof val === 'string') {
            return parseInt(val);
        }
        return val;
    }, z.number().int().optional()),
    product_match: z.nativeEnum(ProductMatch).optional(),
});

const addAdvertisementItemSchema = z.object({
    ad_image_id: z.string().trim().uuid(),
    advertisement_text: z.string().trim(),
    retail_price: z.number().positive(),
    promotional_price: z.number().positive(),
});

const matchAdvertisementItemSchema = z.object({
    ad_item_id: z.string().trim().uuid(),
    match_id: z.string().trim().uuid(),
});

const matchAdItemTypeSchema = z.object({
    match_type: z.nativeEnum(AdItemMatchType),
});

export {
    createProductGroupSchema,
    productGroupIDSchema,
    updateProductGroupSchema,
    attachProductToGroupSchema,
    getAllProductGroupsSchema,
    removeProductsFromGroupSchema,
    createAdvertisementSchema,
    getAdvertisementsSchema,
    advertisementIDSchema,
    getSingleAdvertisementSchema,
    updateAdvertisementSchema,
    exportToExcelAdvertisementsSchema,
    advertisementItemIDSchema,
    addAdvertisementItemSchema,
    matchAdvertisementItemSchema,
    matchAdItemTypeSchema,
};
