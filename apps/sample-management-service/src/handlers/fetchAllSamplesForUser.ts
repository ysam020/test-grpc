import {
    errorMessage,
    responseMessage,
    SampleType,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { findAllSamplesForUser } from '../services/model.services';
import { FetchAllSamplesForUserSchemaType } from '../validations';
import { userStub } from '../client';
import {
    FetchAllSamplesForUserRequest__Output,
    FetchAllSamplesForUserResponse,
    FetchAllSamplesForUserResponse__Output,
} from '@atc/proto';

export const FetchAllSampleForUser = async (
    call: CustomServerUnaryCall<
        FetchAllSamplesForUserRequest__Output,
        FetchAllSamplesForUserResponse
    >,
    callback: sendUnaryData<FetchAllSamplesForUserResponse__Output>,
) => {
    try {
        const { userID, role } = call.user;
        const { page, limit } = utilFns.removeEmptyFields(
            call.request,
        ) as FetchAllSamplesForUserSchemaType;

        let userData;
        try {
            userData = await new Promise<any>((resolve, reject) => {
                userStub.GetSingleUser(
                    { id: userID },
                    call.metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });
        } catch (error) {
            throw error;
        }

        let params: any = {
            type: SampleType.PUBLISHED,
            page,
            limit,
            role,
            userID,
            userCreatedAt: userData?.data.createdAt,
        };

        const { samples, total_count } = await findAllSamplesForUser(params);

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
