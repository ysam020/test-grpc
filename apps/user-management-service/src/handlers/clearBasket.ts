import { errorMessage, responseMessage } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    ClearBasketRequest__Output,
    ClearBasketResponse,
    ClearBasketResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { deleteBasketByID, getBasketByUserID } from '../services/model.service';

export const clearBasket = async (
    call: CustomServerUnaryCall<
        ClearBasketRequest__Output,
        ClearBasketResponse
    >,
    callback: sendUnaryData<ClearBasketResponse__Output>,
) => {
    try {
        const { userID } = call.user;

        const basket = await getBasketByUserID(userID);
        if (!basket) {
            return callback(null, {
                message: errorMessage.BASKET.BASKET_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        await deleteBasketByID(basket.id);

        return callback(null, {
            message: responseMessage.BASKET.CLEAR_BASKET_SUCCESS,
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
