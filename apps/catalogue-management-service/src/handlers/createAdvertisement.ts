import {
    errorMessage,
    processFilesQueue,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    CreateAdvertisementRequest__Output,
    DefaultResponse,
    DefaultResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { createAdvertisementType } from '../validations';
import { addAdvertisement, getRetailerByID } from '../services/model.service';

export const createAdvertisement = async (
    call: CustomServerUnaryCall<
        CreateAdvertisementRequest__Output,
        DefaultResponse
    >,
    callback: sendUnaryData<DefaultResponse__Output>,
) => {
    try {
        const {
            title,
            keyword,
            retailer_id,
            advertisement_type,
            start_date,
            end_date,
            files,
        } = utilFns.removeEmptyFields(call.request) as createAdvertisementType;

        const retailer = await getRetailerByID(retailer_id);
        if (!retailer) {
            return callback(null, {
                message: errorMessage.RETAILER.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const advertisement = await addAdvertisement({
            title,
            keyword,
            Retailer: { connect: { id: retailer_id } },
            advertisement_type,
            start_date,
            end_date,
        });

        await processFilesQueue.add(
            `process:${advertisement.id}`,
            {
                advertisement_id: advertisement.id,
                files: files.map((file) => ({
                    buffer: file.buffer,
                    mime_type: file.mime_type,
                    content_length: file.content_length,
                })),
            },
            {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            },
        );

        return callback(null, {
            message: responseMessage.ADVERTISEMENT.CREATED,
            status: status.OK,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
