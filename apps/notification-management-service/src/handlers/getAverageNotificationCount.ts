import { errorMessage, responseMessage } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    CountResponse,
    CountResponse__Output,
    Empty__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { avgNotificationCount } from '../services/model.service';

export const getAverageNotificationCount = async (
    call: CustomServerUnaryCall<Empty__Output, CountResponse>,
    callback: sendUnaryData<CountResponse__Output>,
) => {
    try {
        const count = await avgNotificationCount();

        return callback(null, {
            message: responseMessage.OTHER.DATA_FOUND,
            status: status.OK,
            data: { count: Math.round(count) },
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
