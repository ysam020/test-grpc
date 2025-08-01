import { errorMessage, responseMessage } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    NewProductListResponse__Output,
    NewProductListResponse,
    Empty__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getNewProductList } from '../services/model-services';

export const getNewProductListHandler = async (
    call: CustomServerUnaryCall<Empty__Output, NewProductListResponse__Output>,
    callback: sendUnaryData<NewProductListResponse>,
) => {
    try {
        const products = await getNewProductList();

        return callback(null, {
            message: responseMessage.PRODUCT.SUCCESS,
            status: status.OK,
            data: { products },
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
