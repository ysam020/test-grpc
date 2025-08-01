import {
    deleteCategoryRequest__Output,
    deleteCategoryResponse,
    deleteCategoryResponse__Output,
} from '@atc/proto';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import { errorMessage } from '@atc/common';
import { sendUnaryData } from '@grpc/grpc-js';
import { deleteCategory } from '../services/model-services';

export const deleteCategoryHandler = async (
    call: CustomServerUnaryCall<
        deleteCategoryRequest__Output,
        deleteCategoryResponse
    >,
    callback: sendUnaryData<deleteCategoryResponse__Output>,
) => {
    const { category_id } = call.request;
    try {
        const { message, status } = await deleteCategory(category_id);
        return callback(null, {
            message,
            status,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: 500,
        });
    }
};
