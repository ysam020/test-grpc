import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    GetAllResponsesByUserIDRequest__Output,
    GetAllResponsesByUserIDResponse,
    GetAllResponsesByUserIDResponse__Output,
} from '@atc/proto';
import { findAllSurveyResponseByUserID } from '../services/model.service';
import { userStub } from '../client';
import { GetAllResponsesByUserIDType } from '../validations';

export const GetAllResponsesByUserID = async (
    call: CustomServerUnaryCall<
        GetAllResponsesByUserIDRequest__Output,
        GetAllResponsesByUserIDResponse
    >,
    callback: sendUnaryData<GetAllResponsesByUserIDResponse__Output>,
) => {
    const { page, limit, id } = utilFns.removeEmptyFields(
        call.request,
    ) as GetAllResponsesByUserIDType;

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

        const { responses, totalCount } = await findAllSurveyResponseByUserID(
            id,
            page,
            limit,
        );

        return callback(null, {
            message: responseMessage.SURVEY.RESPONSE_RETRIEVED,
            status: status.OK,
            data: {
                response_data: responses || [],
                total_count: totalCount,
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
