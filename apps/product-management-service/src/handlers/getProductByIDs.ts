import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetProductByIDsRequest__Output,
    GetProductByIDsResponse,
    GetProductByIDsResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getProducts } from '../services/model-services';

export const getProductByIDs = async (
    call: CustomServerUnaryCall<
        GetProductByIDsRequest__Output,
        GetProductByIDsResponse
    >,
    callback: sendUnaryData<GetProductByIDsResponse__Output>,
) => {
    try {
        const { product_ids } = utilFns.removeEmptyFields(call.request);

        const products = await getProducts(product_ids);
        if (products.length === 0) {
            return callback(null, {
                message: errorMessage.PRODUCT.NOT_FOUND,
                status: status.NOT_FOUND,
                product_ids: [],
            });
        }

        return callback(null, {
            message: responseMessage.PRODUCT.SUCCESS,
            status: status.OK,
            product_ids: products.map((product) => product.id),
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
            product_ids: [],
        });
    }
};
