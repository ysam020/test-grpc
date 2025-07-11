import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DefaultResponse,
    DefaultResponse__Output,
    FinishLaterAdvertisementRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getAdvertisementByID,
    updateAdvertisementByID,
} from '../services/model.service';
import { prismaClient } from '@atc/db';

export const finishLaterAdvertisement = async (
    call: CustomServerUnaryCall<
        FinishLaterAdvertisementRequest__Output,
        DefaultResponse
    >,
    callback: sendUnaryData<DefaultResponse__Output>,
) => {
    try {
        const { advertisement_id } = utilFns.removeEmptyFields(call.request);

        const { advertisement, matchSummary } =
            await getAdvertisementByID(advertisement_id);
        if (!advertisement) {
            return callback(null, {
                message: errorMessage.ADVERTISEMENT.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const total = Number(matchSummary?.total_items) || 0;
        const matched = Number(matchSummary?.matched_items) || 0;

        const match_percentage =
            total > 0 ? Math.round((matched / total) * 100) : 0;

        const advertisementStatus =
            match_percentage === 100
                ? prismaClient.AdvertisementStatus.COMPLETED
                : prismaClient.AdvertisementStatus.NEEDS_REVIEW;

        await updateAdvertisementByID(advertisement_id, {
            match_percentage,
            advertisement_status: advertisementStatus,
        });

        return callback(null, {
            message: responseMessage.ADVERTISEMENT.FINISHED_LATER,
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
