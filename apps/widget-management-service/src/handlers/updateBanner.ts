import {
    constants,
    errorMessage,
    invalidateCloudFrontCache,
    putS3Object,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    UpdateBannerRequest__Output,
    UpdateBannerResponse,
    UpdateBannerResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { updateBannerType } from '../validations';
import { prismaClient } from '@atc/db';
import {
    getAllBrands,
    getAllCategories,
    getAllRetailers,
    getBannerByID,
    updateBannerByID,
} from '../services/model.service';
import { getSampleByID } from '../services/client.service';

export const updateBanner = async (
    call: CustomServerUnaryCall<
        UpdateBannerRequest__Output,
        UpdateBannerResponse
    >,
    callback: sendUnaryData<UpdateBannerResponse__Output>,
) => {
    try {
        const {
            id,
            banner_name,
            link,
            link_type,
            image,
            mime_type,
            content_length,
            internal_link_type,
            sample_id,
            promotion_type,
            brand_ids,
            retailer_ids,
            category_ids,
        } = utilFns.removeEmptyFields(call.request) as updateBannerType;

        const updateBannerData: prismaClient.Prisma.BannerUpdateInput = {};

        const banner = await getBannerByID(id);
        if (!banner) {
            return callback(null, {
                message: errorMessage.BANNER.NOT_FOUND,
                data: null,
                status: status.NOT_FOUND,
            });
        }

        if (banner_name) {
            updateBannerData.banner_name = banner_name;
        }
        if (link) {
            updateBannerData.link = link;
        }
        if (link_type) {
            updateBannerData.link_type = link_type;
        }

        if (image) {
            await invalidateCloudFrontCache(`${constants.BANNER_FOLDER}/${id}`);

            await putS3Object(
                constants.BANNER_FOLDER,
                image,
                id,
                mime_type,
                content_length,
            );

            updateBannerData.image = id;
        }

        if (
            internal_link_type &&
            internal_link_type !== banner.internal_link_type
        ) {
            if (internal_link_type === prismaClient.InternalLinkType.PRODUCT) {
                updateBannerData.Sample = { disconnect: true };
            } else if (
                internal_link_type === prismaClient.InternalLinkType.SAMPLE
            ) {
                updateBannerData.promotion_type = null;
                updateBannerData.brands = { set: [] };
                updateBannerData.categories = { set: [] };
                updateBannerData.retailers = { set: [] };
            }
        }

        if (internal_link_type) {
            updateBannerData.internal_link_type = internal_link_type;
        }
        if (
            internal_link_type === prismaClient.InternalLinkType.SAMPLE &&
            sample_id
        ) {
            const sample = await getSampleByID(sample_id, call.metadata);
            if (!sample) {
                return callback(null, {
                    message: errorMessage.SAMPLE.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }

            updateBannerData.Sample = { connect: { id: sample_id } };
        }
        if (
            internal_link_type === prismaClient.InternalLinkType.PRODUCT &&
            promotion_type
        ) {
            updateBannerData.promotion_type = promotion_type;
        }
        if (
            internal_link_type === prismaClient.InternalLinkType.PRODUCT &&
            brand_ids &&
            brand_ids.length > 0
        ) {
            const brands = await getAllBrands(brand_ids);

            if (brands.length !== brand_ids.length) {
                return callback(null, {
                    message: errorMessage.BRAND.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }

            updateBannerData.brands = {
                set: brand_ids.map((id) => ({ id })),
            };
        } else if (brand_ids && brand_ids?.length === 0) {
            updateBannerData.brands = { set: [] };
        }
        if (
            internal_link_type === prismaClient.InternalLinkType.PRODUCT &&
            retailer_ids &&
            retailer_ids.length > 0
        ) {
            const retailers = await getAllRetailers(retailer_ids);

            if (retailers.length !== retailer_ids.length) {
                return callback(null, {
                    message: errorMessage.RETAILER.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }

            updateBannerData.retailers = {
                set: retailer_ids.map((id) => ({ id })),
            };
        } else if (retailer_ids && retailer_ids?.length === 0) {
            updateBannerData.retailers = { set: [] };
        }
        if (
            internal_link_type === prismaClient.InternalLinkType.PRODUCT &&
            category_ids &&
            category_ids.length > 0
        ) {
            const categories = await getAllCategories(category_ids);

            if (categories.length !== category_ids.length) {
                return callback(null, {
                    message: errorMessage.CATEGORY.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }

            updateBannerData.categories = {
                set: category_ids.map((id) => ({ id })),
            };
        } else if (category_ids && category_ids.length === 0) {
            updateBannerData.categories = { set: [] };
        }

        if (link_type === prismaClient.BannerLinkType.EXTERNAL) {
            updateBannerData.promotion_type = null;
            updateBannerData.brands = { set: [] };
            updateBannerData.categories = { set: [] };
            updateBannerData.retailers = { set: [] };
            updateBannerData.Sample = { disconnect: true };
        }
        if (link_type === prismaClient.BannerLinkType.INTERNAL) {
            updateBannerData.link = null;
        }

        const updatedData = await updateBannerByID(id, updateBannerData);

        const response = await getBannerByID(banner.id);

        return callback(null, {
            message: responseMessage.BANNER.UPDATED,
            status: status.OK,
            data: {
                banner_id: updatedData.id,
                banner_name: updatedData.banner_name,
                link: updatedData.link || '',
                link_type: updatedData.link_type,
                image: updatedData.image || '',
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
