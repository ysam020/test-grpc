import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DefaultResponse,
    DefaultResponse__Output,
    ToggleManualMatchRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getAdvertisementItemByID,
    setIsMatchedToFalse,
} from '../services/model.service';

export const toggleManualMatch = async (
    call: CustomServerUnaryCall<
        ToggleManualMatchRequest__Output,
        DefaultResponse
    >,
    callback: sendUnaryData<DefaultResponse__Output>,
) => {
    try {
        const { ad_item_id } = utilFns.removeEmptyFields(call.request);

        const advertisementItem = await getAdvertisementItemByID(ad_item_id);
        if (!advertisementItem) {
            return callback(null, {
                message:
                    errorMessage.ADVERTISEMENT.ADVERTISEMENT_ITEM_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        if (!advertisementItem.is_matched) {
            return callback(null, {
                message: errorMessage.ADVERTISEMENT.CANNOT_TOGGLE_TO_MATCHED,
                status: status.FAILED_PRECONDITION,
            });
        }

        await setIsMatchedToFalse(ad_item_id);

        return callback(null, {
            message: responseMessage.ADVERTISEMENT.ADVERTISEMENT_ITEM_UPDATED,
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
