import {
    getRetailerListResponse,
    getRetailerListResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { getRetailerList } from '../services/model-services';

export const getRetailerListHandler = async (
    call: ServerUnaryCall<any, getRetailerListResponse>,
    callback: sendUnaryData<getRetailerListResponse__Output>,
) => {
    try {
        const { keyword, sort_by_order, page, limit } =
            utilFns.removeEmptyFields(call.request);

        const { retailers, total_count } = await getRetailerList(
            keyword,
            sort_by_order,
            page,
            limit,
        );

        return callback(null, {
            data: { retailers, total_count },
            message: responseMessage.PRODUCT.SUCCESS,
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
