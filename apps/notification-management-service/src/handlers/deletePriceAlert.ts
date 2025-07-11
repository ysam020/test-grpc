import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DeletePriceAlertRequest__Output,
    DeletePriceAlertResponse,
    DeletePriceAlertResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    deletePriceAlertByID,
    getPriceAlertByProductID,
} from '../services/model.service';

export const deletePriceAlert = async (
    call: CustomServerUnaryCall<
        DeletePriceAlertRequest__Output,
        DeletePriceAlertResponse
    >,
    callback: sendUnaryData<DeletePriceAlertResponse__Output>,
) => {
    try {
        const { product_id } = utilFns.removeEmptyFields(call.request);
        const { userID } = call.user;

        const priceAlert = await getPriceAlertByProductID(product_id, userID);
        if (!priceAlert) {
            return callback(null, {
                message: errorMessage.PRICE_ALERT.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        if (priceAlert.user_id !== userID) {
            return callback(null, {
                message: errorMessage.USER.UNAUTHORIZED_ACCESS,
                status: status.UNAUTHENTICATED,
            });
        }

        await deletePriceAlertByID(priceAlert.id);

        return callback(null, {
            message: responseMessage.PRICE_ALERT.DELETED,
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
