import { constants, deleteS3Object } from '@atc/common';
import { dbClient, prismaClient } from '@atc/db';
import { logger } from '@atc/logger';
import { getSampleByID } from './client.service';

const createWidget = async (widget: prismaClient.Prisma.WidgetCreateInput) => {
    try {
        return await dbClient.widget.create({ data: widget });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getWidgetByID = async (widgetID: string) => {
    try {
        return await dbClient.widget.findUnique({
            where: { id: widgetID },
            include: { WidgetComponent: true },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const createBanner = async (banner: prismaClient.Prisma.BannerCreateInput) => {
    try {
        return await dbClient.banner.create({ data: banner });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getBannerByID = async (bannerID: string) => {
    try {
        return await dbClient.banner.findUnique({
            where: { id: bannerID },
            include: {
                brands: true,
                categories: true,
                retailers: true,
                Sample: {
                    include: {
                        product: { include: { product: true } },
                    },
                },
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateBannerByID = async (
    id: string,
    data: prismaClient.Prisma.BannerUpdateInput,
) => {
    try {
        return await dbClient.banner.update({ where: { id }, data });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const createWidgetComponent = async (
    widgetComponent: prismaClient.Prisma.WidgetComponentCreateInput,
) => {
    try {
        return await dbClient.widgetComponent.create({ data: widgetComponent });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getWidgetComponentByRefID = async (
    refID: string,
    refType: prismaClient.WidgetComponentType,
    widgetID?: string,
) => {
    try {
        const query: any = {
            reference_model_id: refID,
            reference_model: refType,
        };
        if (widgetID) {
            query.widget_id = widgetID;
        }

        return await dbClient.widgetComponent.findFirst({
            where: query,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const deleteBannerByID = async (bannerID: string) => {
    try {
        return await dbClient.banner.delete({ where: { id: bannerID } });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const deleteWidgetComponentByID = async (widgetComponentID: string) => {
    try {
        return await dbClient.widgetComponent.delete({
            where: { id: widgetComponentID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const upsertWidgetComponent = async (
    widgetComponentData: prismaClient.Prisma.WidgetComponentCreateInput,
) => {
    try {
        const { widget, order, reference_model_id } = widgetComponentData;

        return await dbClient.widgetComponent.upsert({
            where: {
                widget_id_reference_model_id: {
                    widget_id: widget.connect!.id!,
                    reference_model_id,
                },
            },
            update: { order, reference_model_id },
            create: widgetComponentData,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const createProductSlider = async (
    productSliderData: prismaClient.Prisma.ProductSliderCreateInput,
) => {
    try {
        return await dbClient.productSlider.create({ data: productSliderData });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateProductSliderByID = async (
    productSliderID: prismaClient.Prisma.ProductSliderWhereUniqueInput['id'],
    productSliderData: prismaClient.Prisma.ProductSliderUpdateInput,
) => {
    try {
        return await dbClient.productSlider.update({
            where: { id: productSliderID },
            data: productSliderData,
            select: {
                id: true,
                promotion_type: true,
                brands: { select: { id: true, brand_name: true } },
                retailers: { select: { id: true, retailer_name: true } },
                categories: { select: { id: true, category_name: true } },
                module_name: true,
                number_of_product: true,
                sort_by_field: true,
                sort_by_order: true,
                background_color: true,
                brand_logo: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getProductSliderByID = async (
    productSliderID: prismaClient.Prisma.ProductSliderWhereUniqueInput['id'],
) => {
    try {
        return await dbClient.productSlider.findUnique({
            where: { id: productSliderID },
            include: {
                brands: { select: { id: true, brand_name: true } },
                retailers: { select: { id: true, retailer_name: true } },
                categories: { select: { id: true, category_name: true } },
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const deleteProductSliderByID = async (
    productSliderID: prismaClient.Prisma.ProductSliderWhereUniqueInput['id'],
) => {
    try {
        return await dbClient.productSlider.delete({
            where: { id: productSliderID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateWidgetStatuses = async (
    oldStatus: prismaClient.WidgetStatusEnum,
    newStatus: prismaClient.WidgetStatusEnum,
) => {
    try {
        return await dbClient.widget.updateMany({
            where: { status: oldStatus },
            data: { status: newStatus },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateWidgetByID = async (
    widgetID: prismaClient.Prisma.WidgetWhereUniqueInput['id'],
    widgetData: prismaClient.Prisma.WidgetUpdateInput,
) => {
    try {
        return await dbClient.widget.update({
            where: { id: widgetID },
            data: widgetData,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateWidgetComponentOrders = async (
    componentOrders: {
        component_id: string;
        order: number;
    }[],
) => {
    try {
        return await dbClient.$transaction(async (prisma) => {
            for (const componentOrder of componentOrders) {
                await prisma.widgetComponent.update({
                    where: { id: componentOrder.component_id },
                    data: { order: componentOrder.order },
                });
            }
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAllWidgets = async (
    page: number,
    limit: number,
    metadata: any,
    widgetID?: string,
    getActive: boolean = false,
) => {
    try {
        const skip = (page - 1) * limit;

        const query = {
            skip: skip,
            take: limit,
            include: {
                WidgetComponent: true,
            },
            ...(widgetID && { where: { id: widgetID } }),
            ...(getActive && {
                where: { status: prismaClient.WidgetStatusEnum.ACTIVE },
            }),
        };

        const widgets = await dbClient.widget.findMany(query);

        const totalCount = await dbClient.widget.count();

        const componentIDs = widgets.flatMap((widget) =>
            widget.WidgetComponent.map(
                (component) => component.reference_model_id,
            ),
        );

        const banners = await dbClient.banner.findMany({
            where: {
                id: {
                    in: componentIDs,
                },
            },
            include: { brands: true, retailers: true, categories: true },
        });

        const productSliders = await dbClient.productSlider.findMany({
            where: {
                id: {
                    in: componentIDs,
                },
            },
            include: { brands: true, retailers: true, categories: true },
        });

        const surveys = await dbClient.survey.findMany({
            where: {
                id: {
                    in: componentIDs,
                },
            },
        });

        const referenceModelsMap: {
            BANNER: Record<string, any>;
            PRODUCT_SLIDER: Record<string, any>;
            SURVEY: Record<string, any>;
        } = {
            BANNER: banners.reduce(
                (acc, banner) => ({ ...acc, [banner.id]: banner }),
                {},
            ),
            PRODUCT_SLIDER: productSliders.reduce(
                (acc, slider) => ({ ...acc, [slider.id]: slider }),
                {},
            ),
            SURVEY: surveys.reduce(
                (acc, survey) => ({ ...acc, [survey.id]: survey }),
                {},
            ),
        };

        const widgetsData = await Promise.all(
            widgets.map(async (widget) => {
                const components = await Promise.all(
                    widget.WidgetComponent.map(async (component) => {
                        const referenceModel =
                            referenceModelsMap[
                                component.reference_model as keyof typeof referenceModelsMap
                            ][component.reference_model_id];

                        const name = referenceModel
                            ? referenceModel.banner_name ||
                              referenceModel.name ||
                              referenceModel.module_name
                            : '';

                        const image = referenceModel
                            ? referenceModel.image || referenceModel.brand_logo
                            : '';

                        const survey_id =
                            component.reference_model ===
                                prismaClient.ReferenceModelType.SURVEY &&
                            referenceModel
                                ? referenceModel.id
                                : '';

                        const retailers =
                            referenceModel?.retailers?.map((retailer: any) => ({
                                id: retailer.id,
                                name: retailer.retailer_name,
                            })) || [];

                        const brands =
                            referenceModel?.brands?.map((brand: any) => ({
                                id: brand.id,
                                name: brand.brand_name,
                            })) || [];

                        const categories =
                            referenceModel?.categories?.map(
                                (category: any) => ({
                                    id: category.id,
                                    name: category.category_name,
                                }),
                            ) || [];

                        const link =
                            component.reference_model ===
                                prismaClient.ReferenceModelType.BANNER &&
                            referenceModel
                                ? referenceModel.link
                                : '';

                        const banner_id =
                            component.reference_model ===
                                prismaClient.ReferenceModelType.BANNER &&
                            referenceModel
                                ? referenceModel.id
                                : '';

                        const product_slider_id =
                            component.reference_model ===
                                prismaClient.ReferenceModelType
                                    .PRODUCT_SLIDER && referenceModel
                                ? referenceModel.id
                                : '';

                        const sort_by_field =
                            component.reference_model ===
                                prismaClient.ReferenceModelType
                                    .PRODUCT_SLIDER && referenceModel
                                ? referenceModel.sort_by_field
                                : '';

                        const sort_by_order =
                            component.reference_model ===
                                prismaClient.ReferenceModelType
                                    .PRODUCT_SLIDER && referenceModel
                                ? referenceModel.sort_by_order
                                : '';

                        const end_date =
                            component.reference_model ===
                                prismaClient.ReferenceModelType.SURVEY &&
                            referenceModel
                                ? referenceModel.endDate.toISOString()
                                : '';

                        const internal_link_type =
                            component.reference_model ===
                                prismaClient.ReferenceModelType.BANNER &&
                            referenceModel
                                ? referenceModel.internal_link_type
                                : '';

                        const sample_id =
                            component.reference_model ===
                                prismaClient.ReferenceModelType.BANNER &&
                            referenceModel
                                ? referenceModel.sample_id
                                : '';

                        let sample_name = '';
                        if (sample_id) {
                            try {
                                const sampleData = await getSampleByID(
                                    sample_id,
                                    metadata,
                                );
                                sample_name =
                                    sampleData?.product_data?.name || '';
                            } catch (error) {
                                logger.error(error);
                            }
                        }

                        return {
                            widget_component_id: component.id,
                            content_type: component.component_type,
                            order: component.order,
                            name,
                            retailers,
                            brands,
                            categories,
                            survey_id,
                            image,
                            link,
                            banner_id,
                            product_slider_id,
                            sort_by_field,
                            sort_by_order,
                            end_date,
                            internal_link_type,
                            sample_id,
                            sample_name,
                        };
                    }),
                );

                return {
                    widget_id: widget.id,
                    widget_name: widget.widget_name,
                    is_active:
                        widget.status === prismaClient.WidgetStatusEnum.ACTIVE,
                    component: components.sort((a, b) => a.order - b.order),
                    deploy_date: widget.deploy_date?.toISOString() || '',
                };
            }),
        );

        return { widgetsData, totalCount };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const deleteWidgetByID = async (
    widgetID: prismaClient.Prisma.WidgetWhereUniqueInput['id'],
) => {
    try {
        await dbClient.$transaction(async (prisma) => {
            const widgetComponents = await prisma.widgetComponent.findMany({
                where: { widget_id: widgetID },
            });

            // Extract the IDs of related Banner and ProductSlider entities
            const bannerIDs = widgetComponents
                .filter(
                    (component) =>
                        component.reference_model ===
                        prismaClient.ReferenceModelType.BANNER,
                )
                .map((component) => component.reference_model_id);

            const productSliderIDs = widgetComponents
                .filter(
                    (component) =>
                        component.reference_model ===
                        prismaClient.ReferenceModelType.PRODUCT_SLIDER,
                )
                .map((component) => component.reference_model_id);

            if (bannerIDs.length > 0) {
                for (const bannerID of bannerIDs) {
                    await deleteS3Object(constants.BANNER_FOLDER, bannerID);
                }

                await prisma.banner.deleteMany({
                    where: {
                        id: {
                            in: bannerIDs,
                        },
                    },
                });
            }

            if (productSliderIDs.length > 0) {
                for (const productSliderID of productSliderIDs) {
                    await deleteS3Object(
                        constants.PRODUCT_SLIDER_LOGO_FOLDER,
                        productSliderID,
                    );
                }

                await prisma.productSlider.deleteMany({
                    where: {
                        id: {
                            in: productSliderIDs,
                        },
                    },
                });
            }

            await prisma.widgetComponent.deleteMany({
                where: { widget_id: widgetID },
            });

            await prisma.widget.delete({
                where: { id: widgetID },
            });
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getWidgetComponentByID = async (
    widgetComponentID: prismaClient.Prisma.WidgetComponentWhereUniqueInput['id'],
) => {
    try {
        return await dbClient.widgetComponent.findUnique({
            where: { id: widgetComponentID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getActiveWidgetData = async (widgetID?: string) => {
    try {
        let whereCondition: any = {
            status: prismaClient.WidgetStatusEnum.ACTIVE,
        };

        if (widgetID) {
            whereCondition = { id: widgetID };
        }

        return await dbClient.widget.findFirst({
            where: whereCondition,
            select: {
                id: true,
                widget_name: true,
                WidgetComponent: true,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const checkWidgetNameExists = async (widgetName: string) => {
    try {
        const banner = await dbClient.widget.findFirst({
            where: { widget_name: widgetName },
        });

        return !!banner;
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getOnlyActiveWidget = async () => {
    try {
        return await dbClient.widget.findFirst({
            where: { status: prismaClient.WidgetStatusEnum.ACTIVE },
            include: { WidgetComponent: true },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAllBrands = async (brandIDs: string[]) => {
    try {
        return await dbClient.brand.findMany({
            where: { id: { in: brandIDs } },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAllRetailers = async (retailerIDs: string[]) => {
    try {
        return await dbClient.retailer.findMany({
            where: { id: { in: retailerIDs } },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAllCategories = async (categoryIDs: string[]) => {
    try {
        return await dbClient.category.findMany({
            where: { id: { in: categoryIDs } },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateWidgetSurveyByWidgetComponentID = async (
    widgetComponentID: string,
    surveyID: string,
) => {
    try {
        return await dbClient.widgetComponent.update({
            where: { id: widgetComponentID },
            data: { reference_model_id: surveyID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getWidgetNamesBySampleID = async (sampleID: string) => {
    try {
        const banners = await dbClient.banner.findMany({
            where: { sample_id: sampleID },
            select: { id: true },
        });

        const bannerIDs = banners.map((banner) => banner.id);
        if (bannerIDs.length === 0) {
            return [];
        }

        const widgetComponents = await dbClient.widgetComponent.findMany({
            where: { reference_model_id: { in: bannerIDs } },
            include: { widget: { select: { widget_name: true } } },
        });

        const widgetNames = widgetComponents.map(
            (widgetComponent) => widgetComponent.widget.widget_name,
        );

        return widgetNames;
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const removeSurveyFromWidget = async (
    id: prismaClient.Prisma.SurveyWhereUniqueInput['id'],
) => {
    try {
        return await dbClient.widgetComponent.deleteMany({
            where: {
                reference_model_id: id,
                reference_model: prismaClient.ReferenceModelType.SURVEY,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

export {
    createWidget,
    getWidgetByID,
    createBanner,
    getBannerByID,
    updateBannerByID,
    createWidgetComponent,
    getWidgetComponentByRefID,
    deleteBannerByID,
    deleteWidgetComponentByID,
    upsertWidgetComponent,
    createProductSlider,
    updateProductSliderByID,
    getProductSliderByID,
    deleteProductSliderByID,
    updateWidgetStatuses,
    updateWidgetByID,
    updateWidgetComponentOrders,
    getAllWidgets,
    deleteWidgetByID,
    getWidgetComponentByID,
    checkWidgetNameExists,
    getOnlyActiveWidget,
    getAllBrands,
    getAllRetailers,
    getAllCategories,
    getActiveWidgetData,
    updateWidgetSurveyByWidgetComponentID,
    getWidgetNamesBySampleID,
    removeSurveyFromWidget,
};
