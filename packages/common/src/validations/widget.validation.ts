import { errorMessage, SortByField, SortByOrder } from '../index';
import { prismaClient } from '@atc/db';
import z from 'zod';

const isFutureDate = (date: string, hour: number, minute: number) => {
    const currentDate = new Date();
    const inputDate = new Date(date);
    inputDate.setHours(hour, minute, 0, 0);
    return inputDate > currentDate;
};

const hasUniqueOrders = (componentOrders: { order: number }[]) => {
    const orders = componentOrders.map((co) => co.order);
    return new Set(orders).size === orders.length;
};

const UUIDSchema = z.object({ id: z.string().trim().uuid() });

const addWidgetSchema = z.object({
    widget_name: z.string().trim().toLowerCase().min(3).max(30),
});

const addBannerSchema = z
    .object({
        widget_id: z.string().trim().uuid(),
        banner_name: z.string().trim(),
        link_type: z.nativeEnum(prismaClient.BannerLinkType),
        link: z.string().trim().url().optional(),
        order: z
            .string()
            .refine((value) => {
                const parsed = parseInt(value);
                return !isNaN(parsed) && Number.isInteger(parsed);
            })
            .transform((value) => Math.trunc(parseInt(value))),
        internal_link_type: z
            .nativeEnum(prismaClient.InternalLinkType)
            .optional(),
        sample_id: z.string().trim().uuid().optional(),
        promotion_type: z.nativeEnum(prismaClient.PromotionTypeEnum).optional(),
        brand_ids: z.array(z.string().trim().uuid()).optional(),
        retailer_ids: z.array(z.string().trim().uuid()).optional(),
        category_ids: z.array(z.string().trim().uuid()).optional(),
    })
    .superRefine((data, ctx) => {
        if (
            data.link_type === prismaClient.BannerLinkType.EXTERNAL &&
            !data.link
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: errorMessage.BANNER.LINK_REQUIRED,
                path: ['link'],
            });
        }

        if (
            data.link_type === prismaClient.BannerLinkType.INTERNAL &&
            !data.internal_link_type
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: errorMessage.BANNER.INTERNAL_LINK_TYPE_REQUIRED,
                path: ['internal_link_type'],
            });
        }

        if (
            data.internal_link_type === prismaClient.InternalLinkType.SAMPLE &&
            !data.sample_id
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: errorMessage.BANNER.SAMPLE_ID_REQUIRED,
                path: ['sample_id'],
            });
        }
    });

const updateBannerSchema = z
    .object({
        banner_name: z.string().trim().optional(),
        link_type: z.nativeEnum(prismaClient.BannerLinkType).optional(),
        link: z.string().trim().url().optional(),
        internal_link_type: z
            .nativeEnum(prismaClient.InternalLinkType)
            .optional(),
        sample_id: z.string().trim().uuid().optional(),
        promotion_type: z.nativeEnum(prismaClient.PromotionTypeEnum).optional(),
        brand_ids: z.array(z.string().trim().uuid()).optional(),
        retailer_ids: z.array(z.string().trim().uuid()).optional(),
        category_ids: z.array(z.string().trim().uuid()).optional(),
    })
    .superRefine((data, ctx) => {
        if (
            data.link_type === prismaClient.BannerLinkType.EXTERNAL &&
            !data.link
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: errorMessage.BANNER.LINK_REQUIRED,
                path: ['link'],
            });
        }

        if (
            data.link_type === prismaClient.BannerLinkType.INTERNAL &&
            !data.internal_link_type
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: errorMessage.BANNER.INTERNAL_LINK_TYPE_REQUIRED,
                path: ['internal_link_type'],
            });
        }

        if (
            data.internal_link_type === prismaClient.InternalLinkType.SAMPLE &&
            !data.sample_id
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: errorMessage.BANNER.SAMPLE_ID_REQUIRED,
                path: ['sample_id'],
            });
        }
    });

const addWidgetSurveySchema = z.object({
    widget_id: z.string().trim().uuid(),
    survey_id: z.string().trim().uuid(),
    order: z.number(),
});

const deleteWidgetSurveySchema = z.object({
    widget_id: z.string().trim().uuid(),
    survey_id: z.string().trim().uuid(),
});

const addProductSliderSchema = z
    .object({
        widget_id: z.string().trim().uuid(),
        promotion_type: z.nativeEnum(prismaClient.PromotionTypeEnum).optional(),
        brand_ids: z.array(z.string().trim().uuid()).optional(),
        retailer_ids: z.array(z.string().trim().uuid()).optional(),
        category_ids: z.array(z.string().trim().uuid()).optional(),
        module_name: z.string(),
        number_of_product: z
            .string()
            .refine((value) => {
                const parsed = parseInt(value);
                return !isNaN(parsed) && Number.isInteger(parsed);
            })
            .transform((value) => Math.trunc(parseInt(value))),
        sort_by_field: z.nativeEnum(SortByField),
        sort_by_order: z.nativeEnum(SortByOrder),
        background_color: z.string().startsWith('#'),
        order: z
            .string()
            .refine((value) => {
                const parsed = parseInt(value);
                return !isNaN(parsed) && Number.isInteger(parsed);
            })
            .transform((value) => Math.trunc(parseInt(value))),
    })
    .strict();

const updateProductSliderSchema = z.object({
    promotion_type: z.nativeEnum(prismaClient.PromotionTypeEnum).optional(),
    brand_ids: z.array(z.string().trim().uuid()).optional(),
    retailer_ids: z.array(z.string().trim().uuid()).optional(),
    category_ids: z.array(z.string().trim().uuid()).optional(),
    module_name: z.string().optional(),
    number_of_product: z
        .string()
        .refine((value) => {
            const parsed = parseInt(value);
            return !isNaN(parsed) && Number.isInteger(parsed);
        })
        .transform((value) => Math.trunc(parseInt(value)))
        .optional(),
    sort_by_field: z.nativeEnum(SortByField).optional(),
    sort_by_order: z.nativeEnum(SortByOrder).optional(),
    background_color: z.string().startsWith('#').optional(),
});

const productSliderIDSchema = z.object({
    product_slider_id: z.string().trim().uuid(),
});

const publishWidgetSchema = z
    .object({
        deploy_date: z
            .string()
            .regex(
                /^\d{4}-\d{2}-\d{2}$/,
                errorMessage.WIDGET.INVALID_DATE_FORMAT,
            ),
        deploy_hour: z.number().int().min(0).max(23),
        deploy_minute: z.number().int().min(0).max(59),
    })
    .refine(
        (data) =>
            isFutureDate(
                data.deploy_date,
                data.deploy_hour,
                data.deploy_minute,
            ),
        { message: errorMessage.WIDGET.DEPLOY_DATE_PAST },
    );

const componentOrderSchema = z.object({
    component_id: z.string().uuid(),
    order: z.number(),
});

const saveAsDraftSchema = z.object({
    component_orders: z
        .array(componentOrderSchema)
        .refine(hasUniqueOrders, errorMessage.WIDGET_COMPONENT.DUPLICATE_ORDER),
});

const getWidgetsSchema = z.object({
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

const widgetIDSchema = z.object({
    widget_id: z.string().trim().uuid(),
});

const bannerIDSchema = z.object({
    banner_id: z.string().trim().uuid(),
});

const surveyIDSchema = z.object({
    survey_id: z.string().trim().uuid(),
});

const updateWidgetSurveySchema = z.object({
    widget_component_id: z.string().trim().uuid(),
});

type addWidgetType = z.infer<typeof addWidgetSchema>;
type addBannerType = z.infer<typeof addBannerSchema>;
type updateBannerType = z.infer<typeof updateBannerSchema>;
type addWidgetSurveyType = z.infer<typeof addWidgetSurveySchema>;
type deleteWidgetSurveyType = z.infer<typeof deleteWidgetSurveySchema>;
type addProductSliderType = z.infer<typeof addProductSliderSchema>;
type updateProductSliderType = z.infer<typeof updateProductSliderSchema>;
type productSliderIDType = z.infer<typeof productSliderIDSchema>;
type publishWidgetType = z.infer<typeof publishWidgetSchema>;
type saveAsDraftType = z.infer<typeof saveAsDraftSchema>;
type getWidgetsType = z.infer<typeof getWidgetsSchema>;
type widgetIDType = z.infer<typeof widgetIDSchema>;
type updateWidgetType = z.infer<typeof updateWidgetSurveySchema>;

export {
    UUIDSchema,
    addWidgetSchema,
    addBannerSchema,
    updateBannerSchema,
    addWidgetSurveySchema,
    deleteWidgetSurveySchema,
    addProductSliderSchema,
    updateProductSliderSchema,
    productSliderIDSchema,
    publishWidgetSchema,
    saveAsDraftSchema,
    getWidgetsSchema,
    widgetIDSchema,
    bannerIDSchema,
    updateWidgetSurveySchema,
    surveyIDSchema,
};
export type {
    addWidgetType,
    addBannerType,
    updateBannerType,
    addWidgetSurveyType,
    deleteWidgetSurveyType,
    addProductSliderType,
    updateProductSliderType,
    productSliderIDType,
    publishWidgetType,
    saveAsDraftType,
    getWidgetsType,
    widgetIDType,
    updateWidgetType,
};
