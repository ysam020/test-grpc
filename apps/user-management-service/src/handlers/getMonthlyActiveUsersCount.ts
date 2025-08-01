import { errorMessage, responseMessage } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    Empty__Output,
    CountResponse,
    CountResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { monthlyActiveUsersCount } from '../services/model.service';

export const getMonthlyActiveUsersCount = async (
    call: CustomServerUnaryCall<Empty__Output, CountResponse>,
    callback: sendUnaryData<CountResponse__Output>,
) => {
    try {
        const count = await monthlyActiveUsersCount();

        return callback(null, {
            message: responseMessage.OTHER.DATA_FOUND,
            status: status.OK,
            data: { count },
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
