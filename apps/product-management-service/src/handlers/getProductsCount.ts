import { errorMessage, responseMessage } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    ProductCountResponse__Output,
    ProductCountResponse,
    Empty__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getProductsCount,
    getCountOfNewProducts,
    getCountOfUnmatchedProducts,
} from '../services/model-services';

export const getProductsCountHandler = async (
    call: CustomServerUnaryCall<Empty__Output, ProductCountResponse__Output>,
    callback: sendUnaryData<ProductCountResponse>,
) => {
    try {
        const count = await getProductsCount();
        const newProductCount = await getCountOfNewProducts();
        const unmatchedProductCount = await getCountOfUnmatchedProducts();

        return callback(null, {
            message: responseMessage.OTHER.DATA_FOUND,
            status: status.OK,
            data: {
                products_count: Math.round(count),
                new_products_count: Math.round(newProductCount),
                unmatched_products_count: Math.round(unmatchedProductCount),
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
