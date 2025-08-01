import {
    errorMessage,
    matchProductsQueue,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    AddAdvertisementItemRequest__Output,
    DefaultResponse,
    DefaultResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { addAdvertisementItemType } from '../validations';
import {
    createAdvertisementItem,
    getAdImageByID,
} from '../services/model.service';

export const addAdvertisementItem = async (
    call: CustomServerUnaryCall<
        AddAdvertisementItemRequest__Output,
        DefaultResponse
    >,
    callback: sendUnaryData<DefaultResponse__Output>,
) => {
    try {
        const {
            ad_image_id,
            advertisement_text,
            retail_price,
            promotional_price,
        } = utilFns.removeEmptyFields(call.request) as addAdvertisementItemType;

        const adImage = await getAdImageByID(ad_image_id);
        if (!adImage) {
            return callback(null, {
                message: errorMessage.ADVERTISEMENT.AD_IMAGE_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const advertisementItem = await createAdvertisementItem({
            AdvertisementImage: {
                connect: {
                    id: ad_image_id,
                },
            },
            advertisement_text,
            retail_price,
            promotional_price,
        });

        await matchProductsQueue.add(
            `match:${advertisementItem.id}`,
            { ad_item_id: advertisementItem.id },
            {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 3000,
                },
            },
        );

        return callback(null, {
            message: responseMessage.ADVERTISEMENT.ADVERTISEMENT_ITEM_ADDED,
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
