import {
    syncDataInElasticRequest__Output,
    syncDataInElasticResponse,
    syncDataInElasticResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, responseMessage } from '@atc/common';
import { logger } from '@atc/logger';
import { syncDataInElastic } from '../services/elastic-services';

export const syncDataInElasticHandler = async (
    call: ServerUnaryCall<
        syncDataInElasticRequest__Output,
        syncDataInElasticResponse
    >,
    callback: sendUnaryData<syncDataInElasticResponse__Output>,
) => {
    try {
        const { message, sync_status } = await syncDataInElastic();
        return callback(null, {
            message,
            status: sync_status,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
