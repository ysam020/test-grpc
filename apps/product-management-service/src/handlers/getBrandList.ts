import {
    getBrandListRequest__Output,
    getBrandListResponse,
    getBrandListResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { getBrandList } from '../services/model-services';
import { getBrandListType } from '../validations';

export const getBrandListHandler = async (
    call: ServerUnaryCall<getBrandListRequest__Output, getBrandListResponse>,
    callback: sendUnaryData<getBrandListResponse__Output>,
) => {
    try {
        const { keyword, page, limit, sort_by_order, sort_by_field } =
            utilFns.removeEmptyFields(call.request) as getBrandListType;

        const { brands, total_count } = await getBrandList(
            keyword,
            sort_by_order,
            page,
            limit,
            sort_by_field,
        );

        return callback(null, {
            data: { brands, total_count },
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
