import { updateRetailerRequest__Output, addRetailerResponse } from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import {
    errorMessage,
    utilFns,
    putS3Object,
    constants,
    invalidateCloudFrontCache,
} from '@atc/common';
import { logger } from '@atc/logger';
import { updateRetailer, findRetailer } from '../services/model-services';

export const updateRetailerHandler = async (
    call: ServerUnaryCall<updateRetailerRequest__Output, addRetailerResponse>,
    callback: sendUnaryData<addRetailerResponse>,
) => {
    try {
        const { image, retailer_name, id, mime_type, content_length } =
            utilFns.removeEmptyFields(call.request);

        const retailer = await findRetailer(id);

        if (!retailer) {
            return callback(null, {
                message: errorMessage.PRODUCT.RETAILER_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const { message, insert_status } = await updateRetailer(
            id,
            retailer_name,
        );

        if (image) {
            await invalidateCloudFrontCache(
                `${constants.RETAILER_IMAGE_FOLDER}/${id}`,
            );

            await putS3Object(
                constants.RETAILER_IMAGE_FOLDER,
                image,
                id,
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
