import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetAllSampleRequest__Output,
    GetAllSampleResponse,
    GetAllSampleResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { findAllSamples } from '../services/model.services';
import { GetAllSamplesType } from '../validations';

export const GetAllSample = async (
    call: CustomServerUnaryCall<
        GetAllSampleRequest__Output,
        GetAllSampleResponse
    >,
    callback: sendUnaryData<GetAllSampleResponse__Output>,
) => {
    try {
        const {
            type,
            page,
            limit,
            sample_status,
            start_date,
            end_date,
            keyword,
        } = utilFns.removeEmptyFields(call.request) as GetAllSamplesType;

        let params: any = {
            type,
            page,
            limit,
            sample_status,
            start_date,
            end_date,
            keyword,
        };

        const { samples, total_count } = await findAllSamples(params);

        return callback(null, {
            message: responseMessage.SAMPLE.RETRIEVED,
            status: status.OK,
            data: { samples: samples || [], total_count },
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
