import {
    AdItemMatchType,
    errorMessage,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DefaultResponse,
    DefaultResponse__Output,
    MatchAdvertisementItemRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { matchAdvertisementItemType } from '../validations';
import {
    getAdSuggestedBrandByID,
    getAdSuggestedGroupByID,
    getAdSuggestedProductByID,
    getAdvertisementItemByID,
    updateAdSuggestedBrandByID,
    updateAdSuggestedGroupByID,
    updateAdSuggestedProductByID,
    updateAdvertisementItemByID,
} from '../services/model.service';
import { prismaClient } from '@atc/db';

export const matchAdvertisementItem = async (
    call: CustomServerUnaryCall<
        MatchAdvertisementItemRequest__Output,
        DefaultResponse
    >,
    callback: sendUnaryData<DefaultResponse__Output>,
) => {
    try {
        const { ad_item_id, match_type, match_id } = utilFns.removeEmptyFields(
            call.request,
        ) as matchAdvertisementItemType;

        const updateData: prismaClient.Prisma.AdvertisementItemUpdateInput = {
            is_matched: true,
        };

        const adItem = await getAdvertisementItemByID(ad_item_id);
        if (!adItem) {
            return callback(null, {
                message:
                    errorMessage.ADVERTISEMENT.ADVERTISEMENT_ITEM_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        switch (match_type) {
            case AdItemMatchType.PRODUCT:
                const suggestedProduct =
                    await getAdSuggestedProductByID(match_id);
                if (!suggestedProduct || !suggestedProduct.MasterProduct) {
                    return callback(null, {
                        message: errorMessage.PRODUCT.NOT_FOUND,
                        status: status.NOT_FOUND,
                    });
                }

                await updateAdSuggestedProductByID(suggestedProduct.id, {
                    is_matched: true,
                });
                updateData.MasterProduct = {
                    connect: {
                        id: suggestedProduct.MasterProduct.id,
                    },
                };

                break;

            case AdItemMatchType.PRODUCT_GROUP:
                const suggestedProductGroup =
                    await getAdSuggestedGroupByID(match_id);
                if (
                    !suggestedProductGroup ||
                    !suggestedProductGroup.ProductGroup
                ) {
                    return callback(null, {
                        message: errorMessage.PRODUCT_GROUP.NOT_FOUND,
                        status: status.NOT_FOUND,
                    });
                }

                await updateAdSuggestedGroupByID(suggestedProductGroup.id, {
                    is_matched: true,
                });
                updateData.ProductGroup = {
                    connect: {
                        id: suggestedProductGroup.ProductGroup.id,
                    },
                };
                break;

            case AdItemMatchType.BRAND:
                const suggestedBrand = await getAdSuggestedBrandByID(match_id);
                if (!suggestedBrand || !suggestedBrand.Brand) {
                    return callback(null, {
                        message: errorMessage.BRAND.NOT_FOUND,
                        status: status.NOT_FOUND,
                    });
                }

                await updateAdSuggestedBrandByID(suggestedBrand.id, {
                    is_matched: true,
                });
                updateData.Brand = {
                    connect: {
                        id: suggestedBrand.Brand.id,
                    },
                };
                break;

            default:
                return callback(null, {
                    message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                    status: status.INTERNAL,
                });
        }

        await updateAdvertisementItemByID(ad_item_id, updateData);

        return callback(null, {
            message: responseMessage.ADVERTISEMENT.ADVERTISEMENT_ITEM_MATCHED,
            status: status.OK,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
