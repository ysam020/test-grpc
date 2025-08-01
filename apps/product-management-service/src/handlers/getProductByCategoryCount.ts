import { errorMessage, responseMessage } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    getProductByCategoryCountResponse__Output,
    getProductByCategoryCountResponse,
    Empty__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getProductByCategoryCount } from '../services/model-services';

export const getProductByCategoryCountHandler = async (
    call: CustomServerUnaryCall<
        Empty__Output,
        getProductByCategoryCountResponse__Output
    >,
    callback: sendUnaryData<getProductByCategoryCountResponse>,
) => {
    try {
        const categories = await getProductByCategoryCount();

        return callback(null, {
            message: responseMessage.PRODUCT.SUCCESS,
            status: status.OK,
            data: categories,
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
