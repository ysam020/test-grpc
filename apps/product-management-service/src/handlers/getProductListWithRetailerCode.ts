import {
    getProductListWithRetailerCodeRequest__Output,
    getProductListWithRetailerCodeResponse,
    getProductListWithRetailerCodeResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { getProductListWithRetailerCode } from '../services/model-services';

export const getProductListWithRetailerCodeHandler = async (
    call: ServerUnaryCall<
        getProductListWithRetailerCodeRequest__Output,
        getProductListWithRetailerCodeResponse__Output
    >,
    callback: sendUnaryData<getProductListWithRetailerCodeResponse__Output>,
) => {
    try {
        const { keyword, page, limit, sort_by_order } =
            utilFns.removeEmptyFields(call.request);

        const { products, total_count } = await getProductListWithRetailerCode(
            keyword,
            sort_by_order,
            page,
            limit,
        );

        if (!products || !products.length) {
            return callback(null, {
                data: {
                    products: [],
                    total_count: 0,
                },
                message: errorMessage.PRODUCT.NOT_FOUND,
                status: status.OK,
            });
        }

        return callback(null, {
            data: { products: products, total_count },
            message: responseMessage.PRODUCT.CATEGORY_LIST_FETCHED,
            status: status.OK,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            data: null,
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
