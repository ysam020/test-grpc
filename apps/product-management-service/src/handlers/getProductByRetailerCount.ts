import { errorMessage, responseMessage } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    getProductByRetailerCountResponse__Output,
    getProductByRetailerCountResponse,
    Empty__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getProductByRetailerCount } from '../services/model-services';

export const getProductByRetailerCountHandler = async (
    call: CustomServerUnaryCall<
        Empty__Output,
        getProductByRetailerCountResponse__Output
    >,
    callback: sendUnaryData<getProductByRetailerCountResponse>,
) => {
    try {
        const retailers = await getProductByRetailerCount();

        return callback(null, {
            message: responseMessage.PRODUCT.SUCCESS,
            status: status.OK,
            data: retailers,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
            data: [],
        });
    }
};
