import {
    matchProductsRequest__Output,
    matchProductsResponse,
    matchProductsResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { matchProducts } from '../services/model-services';

export const matchProductsHandler = async (
    call: ServerUnaryCall<matchProductsRequest__Output, matchProductsResponse>,
    callback: sendUnaryData<matchProductsResponse__Output>,
) => {
    try {
        const { product_to_match_id, potential_match_id } =
            utilFns.removeEmptyFields(
                call.request,
            ) as matchProductsRequest__Output;

        if (!product_to_match_id || !potential_match_id) {
            return callback(null, {
                message: errorMessage.PRODUCT.PROVIDE_VALID_PARAMETER_VALUE,
                status: status.CANCELLED,
            });
        }

        const { message, update_status } = await matchProducts(
            product_to_match_id,
            potential_match_id,
        );

        return callback(null, {
            message,
            status: update_status,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
