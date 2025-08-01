import {
    getCategoryListRequest__Output,
    getCategoryListResponse__Output,
    getCategoryListResponse,
} from '@atc/proto';
import { getCategoryList } from '../services/model-services';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, responseMessage } from '@atc/common';
import { logger } from '@atc/logger';

export const getCategoryListHandler = async (
    call: ServerUnaryCall<
        getCategoryListRequest__Output,
        getCategoryListResponse
    >,
    callback: sendUnaryData<getCategoryListResponse__Output>,
) => {
    try {
        const { keyword, page, limit, sort_by_order } = call.request;
        const { categoryList, totalCount } = await getCategoryList(
            keyword,
            page,
            limit,
            sort_by_order,
        );

        if (!categoryList || !categoryList.length) {
            return callback(null, {
                data: {
                    categories: [],
                    total_count: 0,
                },
                message: errorMessage.PRODUCT.CATEGORY_NOT_FOUND,
                status: status.OK,
            });
        }

        return callback(null, {
            data: { categories: categoryList, total_count: totalCount },
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
