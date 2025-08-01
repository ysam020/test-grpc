import { addRetailerRequest__Output, addRetailerResponse } from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, constants, putS3Object } from '@atc/common';
import { logger } from '@atc/logger';
import { addRetailer } from '../services/model-services';

export const addRetailerHandler = async (
    call: ServerUnaryCall<addRetailerRequest__Output, addRetailerResponse>,
    callback: sendUnaryData<addRetailerResponse>,
) => {
    try {
        const { retailer_name, image, mime_type, content_length } =
            call.request;

        const { retailer_id, message, insert_status } =
            await addRetailer(retailer_name);

        if (image && retailer_id) {
            await putS3Object(
                constants.RETAILER_IMAGE_FOLDER,
                image,
                retailer_id,
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
