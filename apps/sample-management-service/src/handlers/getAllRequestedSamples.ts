import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { userStub } from '../client';
import {
    GetAllRequestedSampleRequest__Output,
    GetAllRequestedSampleResponse,
    GetAllRequestedSampleResponse__Output,
} from '@atc/proto';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { GetAllRequestedSampleType } from '../validations';
import { logger } from '@atc/logger';
import { findAllSampleResponseByUserID } from '../services/model.services';

export const GetAllRequestedSamples = async (
    call: CustomServerUnaryCall<
        GetAllRequestedSampleRequest__Output,
        GetAllRequestedSampleResponse
    >,
    callback: sendUnaryData<GetAllRequestedSampleResponse__Output>,
) => {
    const { page, limit, id } = utilFns.removeEmptyFields(
        call.request,
    ) as GetAllRequestedSampleType;

    try {
        let userID;

        try {
            const { data } = await new Promise<any>((resolve, reject) => {
                userStub.getSingleUser(
                    { id: id },
                    call.metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

            userID = data ? data.id : null;
        } catch (error) {
            throw error;
        }

        if (!userID) {
            return callback(null, {
                message: errorMessage.USER.NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        }

        const { requested_samples, total_count } =
            await findAllSampleResponseByUserID(id, page, limit);

        return callback(null, {
            message: responseMessage.SAMPLE.RETRIEVED,
            status: status.OK,
            data: {
                requested_samples: requested_samples || [],
                total_count,
            },
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
