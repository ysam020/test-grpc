import {
    getAllCategoryListResponse,
    getAllCategoryListResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { getAllCategoryList } from '../services/model-services';

export const getAllCategoryListHandler = async (
    call: ServerUnaryCall<any, getAllCategoryListResponse>,
    callback: sendUnaryData<getAllCategoryListResponse__Output>,
) => {
    try {
        const { keyword, page, limit, sort_by_order } =
            utilFns.removeEmptyFields(call.request);

        const { categories, totalCount } = await getAllCategoryList(
            keyword,
            sort_by_order,
            page,
            limit,
        );

        if (!categories || !categories.length) {
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
            data: { categories, total_count: totalCount },
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
