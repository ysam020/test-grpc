import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    findResposesByUserID,
    findSampleByID,
} from '../services/model.services';
import { userStub } from '../client';
import {
    FetchSampleForUserRequest__Output,
    FetchSampleForUserResponse,
    FetchSampleForUserResponse__Output,
} from '@atc/proto';

export const FetchSampleForUser = async (
    call: CustomServerUnaryCall<
        FetchSampleForUserRequest__Output,
        FetchSampleForUserResponse
    >,
    callback: sendUnaryData<FetchSampleForUserResponse__Output>,
) => {
    try {
        const { userID, role } = call.user;
        const { id } = utilFns.removeEmptyFields(call.request);

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

        let params = { id, role, userCreatedAt: userData.data.createdAt };

        const sample = await findSampleByID(params);
        if (!sample) {
            return callback(null, {
                message: errorMessage.SAMPLE.NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        }

        let responses;

        const questionData =
            sample.question_data && sample.question_data.length > 0
                ? sample.question_data
                : [];

        if (questionData.length > 0) {
            responses = await findResposesByUserID(questionData, userID);
        }

        const userDetails = {
            name:
                userData.data.first_name + ' ' + userData.data.last_name || '',
            address: userData.data.address || '',
        };

        return callback(null, {
            message: responseMessage.SAMPLE.RETRIEVED,
            status: status.OK,
            data: {
                ...sample,
                response_data: responses,
                user_details: userDetails,
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
