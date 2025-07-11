import { errorMessage, utilFns, responseMessage } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    AddPriceAlertRequest__Output,
    AddPriceAlertResponse,
    AddPriceAlertResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { addPriceAlertType } from '../validations';
import { getProductByID, upsertPriceAlert } from '../services/model.service';

export const addPriceAlert = async (
    call: CustomServerUnaryCall<
        AddPriceAlertRequest__Output,
        AddPriceAlertResponse
    >,
    callback: sendUnaryData<AddPriceAlertResponse__Output>,
) => {
    try {
        const { product_id, target_price } = utilFns.removeEmptyFields(
            call.request,
        ) as addPriceAlertType;
        const { userID } = call.user;

        const product = await getProductByID(product_id);
        if (!product) {
            return callback(null, {
                message: errorMessage.PRODUCT.NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        }

        const priceAlert = await upsertPriceAlert({
            User: { connect: { id: userID } },
            MasterProduct: { connect: { id: product_id } },
            target_price,
        });

        return callback(null, {
            message: responseMessage.PRICE_ALERT.ADDED,
            status: status.OK,
            data: {
                price_alert_id: priceAlert.id,
                user_id: priceAlert.user_id,
                product_id: priceAlert.product_id,
                target_price: Number(priceAlert.target_price),
                createdAt: priceAlert.createdAt.toISOString(),
                updatedAt: priceAlert.updatedAt.toISOString(),
            },
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
            data: null,
        });
    }
};
