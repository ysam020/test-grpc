import {
    AdItemMatchType,
    catalogueValidation,
    constants,
    errorMessage,
    ProductMatch,
} from '@atc/common';
import { prismaClient } from '@atc/db';
import z from 'zod';

const productGroupIDSchema = z.object({
    group_id: z.string().trim().uuid(),
});

const updateProductGroupSchema = catalogueValidation.createProductGroupSchema
    .partial()
    .extend({
        group_id: z.string().trim().uuid(),
    });

const attachProductsToGroupSchema = z
    .object({
        group_id: z.string().trim().uuid(),
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

        const uniqueProductIDs = new Set(data.product_ids);
        if (uniqueProductIDs.size !== data.product_ids.length) {
            ctx.addIssue({
                path: ['product_ids'],
                code: z.ZodIssueCode.custom,
                message: errorMessage.PRODUCT_GROUP.PRODUCT_IDS_UNIQUE,
            });
        }
    });

const getAttachedProductsSchema = z
    .object({
        group_id: z.string().trim().uuid(),
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
    })
    .strict();

const removeProductsFromGroupSchema = z
    .object({
        group_id: z.string().trim().uuid(),
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

const exportToExcelSchema = z
    .object({
        group_id: z.string().trim().uuid(),
        email: z.string().trim().email(),
    })
    .strict();

const getAllProductGroupsSchema = z
    .object({
        keyword: z.string().trim().optional(),
        brand_id: z.string().uuid().optional(),
        page: z
            .number()
            .int()
            .positive()
            .transform((value) => Math.trunc(value)),
        limit: z
            .number()
            .int()
            .positive()
            .transform((value) => Math.trunc(value)),
    })
    .strict();

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
            )
            .transform((value) => new Date(value)),
        end_date: z
            .string()
            .trim()
            .regex(
                constants.DATE_REGEX,
                errorMessage.WIDGET.INVALID_DATE_FORMAT,
            )
            .transform((value) => new Date(value)),
        files: z.array(
            z.object({
                name: z.string().trim(),
                buffer: z.instanceof(Buffer),
                mime_type: z
                    .string()
                    .regex(
                        constants.MIME_TYPE_REGEX,
                        errorMessage.OTHER.INVALID_MIME_TYPE,
                    )
                    .optional(),
                content_length: z.number().optional(),
            }),
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
        .number()
        .int()
        .positive()
        .transform((value) => Math.trunc(value)),
    limit: z
        .number()
        .int()
        .positive()
        .transform((value) => Math.trunc(value)),
    retailer_id: z.string().trim().uuid().optional(),
    advertisement_type: z.nativeEnum(prismaClient.AdvertisementType).optional(),
    year: z.number().int().optional(),
    month: z.number().int().optional(),
    product_match: z.nativeEnum(ProductMatch).optional(),
    keyword: z.string().trim().optional(),
});

const getSingleAdvertisementSchema = z.object({
    advertisement_id: z.string().trim().uuid(),
    page: z
        .number()
        .int()
        .positive()
        .transform((value) => Math.trunc(value)),
});

const updateAdvertisementSchema = z
    .object({
        advertisement_id: z.string().trim().uuid(),
        title: z.string().trim().optional(),
        retailer_id: z.string().trim().uuid().optional(),
        keyword: z.string().trim().max(50).optional(),
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
            .transform((value) => new Date(value))
            .optional(),
        end_date: z
            .string()
            .trim()
            .regex(
                constants.DATE_REGEX,
                errorMessage.WIDGET.INVALID_DATE_FORMAT,
            )
            .transform((value) => new Date(value))
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
    year: z.number().int().optional(),
    month: z.number().int().optional(),
    product_match: z.nativeEnum(ProductMatch).optional(),
});

const matchAdvertisementItemSchema = z.object({
    ad_item_id: z.string().trim().uuid(),
    match_type: z.nativeEnum(AdItemMatchType),
    match_id: z.string().trim().uuid(),
});

type createProductGroupType = z.infer<
    typeof catalogueValidation.createProductGroupSchema
>;
type updateProductGroupType = z.infer<typeof updateProductGroupSchema>;
type attachProductsToGroupType = z.infer<typeof attachProductsToGroupSchema>;
type getAllProductGroupsType = z.infer<typeof getAllProductGroupsSchema>;
type getAttachedProductsType = z.infer<typeof getAttachedProductsSchema>;
type removeProductsFromGroupType = z.infer<
    typeof removeProductsFromGroupSchema
>;
type exportToExcelType = z.infer<typeof exportToExcelSchema>;
type createAdvertisementType = z.infer<typeof createAdvertisementSchema>;
type getAdvertisementsType = z.infer<typeof getAdvertisementsSchema>;
type getSingleAdvertisementType = z.infer<typeof getSingleAdvertisementSchema>;
type updateAdvertisementType = z.infer<typeof updateAdvertisementSchema>;
type exportToExcelAdvertisementsType = z.infer<
    typeof exportToExcelAdvertisementsSchema
>;
type addAdvertisementItemType = z.infer<
    typeof catalogueValidation.addAdvertisementItemSchema
>;
type matchAdvertisementItemType = z.infer<typeof matchAdvertisementItemSchema>;

export type {
    createProductGroupType,
    updateProductGroupType,
    attachProductsToGroupType,
    getAllProductGroupsType,
    getAttachedProductsType,
    removeProductsFromGroupType,
    exportToExcelType,
    createAdvertisementType,
    getAdvertisementsType,
    getSingleAdvertisementType,
    updateAdvertisementType,
    exportToExcelAdvertisementsType,
    addAdvertisementItemType,
    matchAdvertisementItemType,
};
export {
    productGroupIDSchema,
    updateProductGroupSchema,
    attachProductsToGroupSchema,
    getAttachedProductsSchema,
    removeProductsFromGroupSchema,
    exportToExcelSchema,
    getAllProductGroupsSchema,
    createAdvertisementSchema,
    getAdvertisementsSchema,
    getSingleAdvertisementSchema,
    updateAdvertisementSchema,
    exportToExcelAdvertisementsSchema,
    matchAdvertisementItemSchema,
};
