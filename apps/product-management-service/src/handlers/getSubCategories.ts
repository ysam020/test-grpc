import {
    getSubCategoriesRequest__Output,
    getSubCategoriesResponse__Output,
    getSubCategoriesResponse,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, responseMessage } from '@atc/common';
import { logger } from '@atc/logger';
import { getSubCategories } from '../services/model-services';

export const getSubCategoriesHandler = async (
    call: ServerUnaryCall<
        getSubCategoriesRequest__Output,
        getSubCategoriesResponse
    >,
    callback: sendUnaryData<getSubCategoriesResponse__Output>,
) => {
    try {
        const { category_id } = call.request;

        if (!category_id) {
            return callback(null, {
                data: null,
                message: errorMessage.PRODUCT.CATEGORY_ID_REQUIRED,
                status: status.NOT_FOUND,
            });
        }

        const subCategories = await getSubCategories(category_id);

        if (!subCategories) {
            return callback(null, {
                data: {
                    categories: [],
                },
                message: errorMessage.PRODUCT.SUB_CATEGORY_NOT_FOUND,
                status: status.OK,
            });
        }

        return callback(null, {
            data: { categories: subCategories },
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
