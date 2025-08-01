import {
    AdItemMatchType,
    errorMessage,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetSingleAdvertisementRequest__Output,
    GetSingleAdvertisementResponse,
    GetSingleAdvertisementResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getSingleAdvertisementType } from '../validations';
import { getDetailedAdvertisementByID } from '../services/model.service';

export const getSingleAdvertisement = async (
    call: CustomServerUnaryCall<
        GetSingleAdvertisementRequest__Output,
        GetSingleAdvertisementResponse
    >,
    callback: sendUnaryData<GetSingleAdvertisementResponse__Output>,
) => {
    try {
        const { advertisement_id, page } = utilFns.removeEmptyFields(
            call.request,
        ) as getSingleAdvertisementType;

        const result = await getDetailedAdvertisementByID(
            advertisement_id,
            page,
        );

        if (!result) {
            return callback(null, {
                message: errorMessage.ADVERTISEMENT.NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        }

        return callback(null, {
            message: responseMessage.ADVERTISEMENT.RETRIEVED,
            status: status.OK,
            data: result.mappedAdvertisement,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
            data: null,
        });
    }
};
