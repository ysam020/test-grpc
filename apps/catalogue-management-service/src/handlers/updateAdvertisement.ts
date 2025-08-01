import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DefaultResponse,
    DefaultResponse__Output,
    UpdateAdvertisementRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { updateAdvertisementType } from '../validations';
import {
    getAdvertisementByID,
    updateAdvertisementByID,
} from '../services/model.service';
import { prismaClient } from '@atc/db';

export const updateAdvertisement = async (
    call: CustomServerUnaryCall<
        UpdateAdvertisementRequest__Output,
        DefaultResponse
    >,
    callback: sendUnaryData<DefaultResponse__Output>,
) => {
    try {
        const {
            advertisement_id,
            title,
            retailer_id,
            advertisement_type,
            start_date,
            end_date,
            keyword,
        } = utilFns.removeEmptyFields(call.request) as updateAdvertisementType;
        const updateData: prismaClient.Prisma.AdvertisementUpdateInput = {
            keyword: keyword || null,
        };

        const { advertisement } = await getAdvertisementByID(advertisement_id);
        if (!advertisement) {
            return callback(null, {
                message: errorMessage.ADVERTISEMENT.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        if (title) {
            updateData.title = title;
        }
        if (retailer_id) {
            updateData.Retailer = {
                connect: {
                    id: retailer_id,
                },
            };
        }
        if (advertisement_type) {
            updateData.advertisement_type = advertisement_type;
        }
        if (start_date) {
            updateData.start_date = start_date;
        }
        if (end_date) {
            updateData.end_date = end_date;
        }

        await updateAdvertisementByID(advertisement_id, updateData);

        return callback(null, {
            message: responseMessage.ADVERTISEMENT.UPDATED,
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
