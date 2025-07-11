import {
    updateCategoryRequest__Output,
    updateCategoryResponse,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import {
    errorMessage,
    utilFns,
    putS3Object,
    constants,
    invalidateCloudFrontCache,
} from '@atc/common';
import { logger } from '@atc/logger';
import { updateCategory, findCategory } from '../services/model-services';

export const updateCategoryHandler = async (
    call: ServerUnaryCall<
        updateCategoryRequest__Output,
        updateCategoryResponse
    >,
    callback: sendUnaryData<updateCategoryResponse>,
) => {
    try {
        const {
            image,
            category_name,
            parent_category_id,
            category_id,
            mime_type,
            content_length,
        } = utilFns.removeEmptyFields(call.request);

        const category = await findCategory(category_id);

        if (!category) {
            return callback(null, {
                message: errorMessage.PRODUCT.CATEGORY_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const { message, insert_status } = await updateCategory(
            category_id,
            category_name,
            parent_category_id,
        );

        if (image) {
            await invalidateCloudFrontCache(
                `${constants.CATEGORY_IMAGE_FOLDER}/${category_id}`,
            );

            await putS3Object(
                constants.CATEGORY_IMAGE_FOLDER,
                image,
                category_id,
                mime_type,
                content_length,
            );
        }

        return callback(null, {
            message,
            status: insert_status,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
