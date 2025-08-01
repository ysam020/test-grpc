import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DefaultResponse,
    DefaultResponse__Output,
    MarkAsCompleteAdvertisementRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getAdvertisementByID,
    updateAdvertisementByID,
} from '../services/model.service';
import { prismaClient } from '@atc/db';

export const markAsCompleteAdvertisement = async (
    call: CustomServerUnaryCall<
        MarkAsCompleteAdvertisementRequest__Output,
        DefaultResponse
    >,
    callback: sendUnaryData<DefaultResponse__Output>,
) => {
    try {
        const { advertisement_id } = utilFns.removeEmptyFields(call.request);

        const { advertisement } = await getAdvertisementByID(advertisement_id);
        if (!advertisement) {
            return callback(null, {
                message: errorMessage.ADVERTISEMENT.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        await updateAdvertisementByID(advertisement_id, {
            match_percentage: 100,
            advertisement_status: prismaClient.AdvertisementStatus.COMPLETED,
        });

        return callback(null, {
            message: responseMessage.ADVERTISEMENT.ADVERTISEMENT_COMPLETED,
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
