import {
    constants,
    errorMessage,
    putS3Object,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    AddBannerRequest__Output,
    AddBannerResponse,
    AddBannerResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { addBannerType } from '../validations';
import {
    createBanner,
    createWidgetComponent,
    getAllBrands,
    getAllCategories,
    getAllRetailers,
    getBannerByID,
    getWidgetByID,
    updateBannerByID,
} from '../services/model.service';
import { prismaClient } from '@atc/db';
import { getSampleByID } from '../services/client.service';

export const addBanner = async (
    call: CustomServerUnaryCall<AddBannerRequest__Output, AddBannerResponse>,
    callback: sendUnaryData<AddBannerResponse__Output>,
) => {
    try {
        const {
            widget_id,
            banner_name,
            link_type,
            link,
            image,
            order,
            mime_type,
            content_length,
            internal_link_type,
            sample_id,
            promotion_type,
            brand_ids,
            retailer_ids,
            category_ids,
        } = utilFns.removeEmptyFields(call.request) as addBannerType;

        const widget = await getWidgetByID(widget_id);
        if (!widget) {
            return callback(null, {
                message: errorMessage.WIDGET.NOT_FOUND,
                data: null,
                status: status.NOT_FOUND,
            });
        }

        if (brand_ids && brand_ids.length > 0) {
            const brands = await getAllBrands(brand_ids);

            if (brands.length !== brand_ids.length) {
                return callback(null, {
                    message: errorMessage.BRAND.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }
        }

        if (retailer_ids && retailer_ids.length > 0) {
            const retailers = await getAllRetailers(retailer_ids);

            if (retailers.length !== retailer_ids.length) {
                return callback(null, {
                    message: errorMessage.RETAILER.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }
        }

        if (category_ids && category_ids.length > 0) {
            const categories = await getAllCategories(category_ids);

            if (categories.length !== category_ids.length) {
                return callback(null, {
                    message: errorMessage.CATEGORY.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }
        }

        if (sample_id) {
            const sample = await getSampleByID(sample_id, call.metadata);
            if (!sample) {
                return callback(null, {
                    message: errorMessage.SAMPLE.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }
        }

        const bannerData: prismaClient.Prisma.BannerCreateInput = {
            banner_name,
            link_type,
        };

        if (link_type === prismaClient.BannerLinkType.EXTERNAL) {
            bannerData.link = link;
        }

        if (
            link_type === prismaClient.BannerLinkType.INTERNAL &&
            internal_link_type === prismaClient.InternalLinkType.SAMPLE
        ) {
            bannerData.internal_link_type = internal_link_type;
            bannerData.Sample = {
                connect: {
                    id: sample_id,
                },
            };
        }

        if (
            link_type === prismaClient.BannerLinkType.INTERNAL &&
            internal_link_type === prismaClient.InternalLinkType.PRODUCT
        ) {
            bannerData.internal_link_type = internal_link_type;
            bannerData.promotion_type = promotion_type;
            bannerData.brands = {
                connect:
                    internal_link_type ===
                        prismaClient.InternalLinkType.PRODUCT && brand_ids
                        ? brand_ids.map((id) => ({ id }))
                        : [],
            };
            bannerData.categories = {
                connect:
                    internal_link_type ===
                        prismaClient.InternalLinkType.PRODUCT && category_ids
                        ? category_ids.map((id) => ({ id }))
                        : [],
            };
            bannerData.retailers = {
                connect:
                    internal_link_type ===
                        prismaClient.InternalLinkType.PRODUCT && retailer_ids
                        ? retailer_ids.map((id) => ({ id }))
                        : [],
            };
        }

        const banner = await createBanner(bannerData);

        await putS3Object(
            constants.BANNER_FOLDER,
            image,
            banner.id,
            mime_type,
            content_length,
        );

        const updatedBanner = await updateBannerByID(banner.id, {
            image: banner.id,
        });

        const widgetComponent = await createWidgetComponent({
            component_type: prismaClient.WidgetComponentType.BANNER,
            order,
            reference_model_id: banner.id,
            reference_model: prismaClient.ReferenceModelType.BANNER,
            widget: { connect: { id: widget_id } },
        });

        const response = await getBannerByID(banner.id);

        return callback(null, {
            message: responseMessage.BANNER.CREATED,
            status: status.OK,
            data: {
                banner_id: updatedBanner.id,
                banner_name: updatedBanner.banner_name,
                link: updatedBanner.link || '',
                link_type: updatedBanner.link_type,
                image: updatedBanner.image || '',
                order: widgetComponent.order!,
                widget_id: widget.id,
                widget_component_id: widgetComponent.id,
                internal_link_type: response?.internal_link_type || '',
                sample_id: response?.sample_id || '',
                promotion_type: response?.promotion_type || '',
                brands: response?.brands.map((brand) => brand.brand_name) || [],
                retailers:
                    response?.retailers.map(
                        (retailer) => retailer.retailer_name,
                    ) || [],
                categories:
                    response?.categories.map(
                        (category) => category.category_name,
                    ) || [],
            },
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            data: null,
            status: status.INTERNAL,
        });
    }
};
