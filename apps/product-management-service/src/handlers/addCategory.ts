import { addCategoryRequest__Output, addCategoryResponse } from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, constants, putS3Object } from '@atc/common';
import { logger } from '@atc/logger';
import { addCategory } from '../services/model-services';

export const addCategoryHandler = async (
    call: ServerUnaryCall<addCategoryRequest__Output, addCategoryResponse>,
    callback: sendUnaryData<addCategoryResponse>,
) => {
    try {
        const {
            category_name,
            parent_category_id,
            image,
            mime_type,
            content_length,
        } = call.request;

        const { category_id, message, insert_status } = await addCategory(
            category_name,
            parent_category_id,
        );

        if (image && category_id) {
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
