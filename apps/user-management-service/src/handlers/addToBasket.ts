import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    AddToBasketRequest__Output,
    AddToBasketResponse,
    AddToBasketResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { addToBasketType } from '../validations';
import {
    createBasket,
    getBasketByUserID,
    getProductByID,
    upsertBasketItem,
} from '../services/model.service';

export const addToBasket = async (
    call: CustomServerUnaryCall<
        AddToBasketRequest__Output,
        AddToBasketResponse
    >,
    callback: sendUnaryData<AddToBasketResponse__Output>,
) => {
    try {
        const { product_id, quantity } = utilFns.removeEmptyFields(
            call.request,
        ) as addToBasketType;
        const { userID } = call.user;

        const product = await getProductByID(product_id);
        if (!product) {
            return callback(null, {
                message: errorMessage.PRODUCT.NOT_FOUND,
                data: null,
                status: status.NOT_FOUND,
            });
        }

        let basket = await getBasketByUserID(userID);
        if (!basket) {
            basket = await createBasket({ user: { connect: { id: userID } } });
        }

        const basketItemData = {
            master_product: { connect: { id: product_id } },
            basket: { connect: { id: basket.id } },
            quantity,
        };

        const basketItem = await upsertBasketItem(basketItemData);

        return callback(null, {
            message: responseMessage.BASKET.ADD_TO_BASKET_SUCCESS,
            data: {
                id: basket.id,
                user_id: basket.user_id,
                master_product_id: basketItem.master_product_id,
                quantity: basketItem.quantity,
            },
            status: status.OK,
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
