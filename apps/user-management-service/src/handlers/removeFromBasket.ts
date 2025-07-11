import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    RemoveFromBasketRequest__Output,
    RemoveFromBasketResponse,
    RemoveFromBasketResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { removeFromBasketType } from '../validations';
import {
    deleteBasketByID,
    deleteBasketItemByID,
    getDetailedBasketByUserID,
} from '../services/model.service';

export const removeFromBasket = async (
    call: CustomServerUnaryCall<
        RemoveFromBasketRequest__Output,
        RemoveFromBasketResponse
    >,
    callback: sendUnaryData<RemoveFromBasketResponse__Output>,
) => {
    try {
        const { master_product_id } = utilFns.removeEmptyFields(
            call.request,
        ) as removeFromBasketType;
        const { userID } = call.user;

        const basket = await getDetailedBasketByUserID(userID);
        if (!basket) {
            return callback(null, {
                message: errorMessage.BASKET.BASKET_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const basketItem = basket.BasketItem.find(
            (item) => item.master_product_id === master_product_id,
        );
        if (!basketItem) {
            return callback(null, {
                message: errorMessage.BASKET.PRODUCT_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        if (basket.BasketItem.length === 1) {
            await deleteBasketByID(basket.id);
        } else {
            await deleteBasketItemByID(basketItem.id);
        }

        return callback(null, {
            message: responseMessage.BASKET.REMOVE_FROM_BASKET_SUCCESS,
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
