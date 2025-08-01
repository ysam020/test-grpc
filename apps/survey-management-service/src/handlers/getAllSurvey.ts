import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    GetAllSurveyRequest__Output,
    GetAllSurveyResponse,
    GetAllSurveyResponse__Output,
} from '@atc/proto';
import { findAllSurvey } from '../services/model.service';
import { userStub } from '../client';
import { GetAllSurveyType } from '../validations';

export const GetAllSurvey = async (
    call: CustomServerUnaryCall<
        GetAllSurveyRequest__Output,
        GetAllSurveyResponse
    >,
    callback: sendUnaryData<GetAllSurveyResponse__Output>,
) => {
    const { type, page, limit, survey_status, keyword } =
        utilFns.removeEmptyFields(call.request) as GetAllSurveyType;

    try {
        let userCount = 0;

        try {
            const { data } = await new Promise<any>((resolve, reject) => {
                userStub.GetUsers(
                    { page: 1, limit: 1 },
                    call.metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

            userCount = data.totalCount;
        } catch (error) {
            throw error;
        }

        const result = await findAllSurvey(
            type,
            page,
            limit,
            survey_status,
            keyword,
        );
        if (!result) {
            return callback(null, {
                message: errorMessage.SURVEY.NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        }

        const surveysWithTotalUsers = result.surveys.map((survey) => ({
            ...survey,
            totalUsers: userCount,
        }));

        return callback(null, {
            message: responseMessage.SURVEY.RETRIEVED,
            status: status.OK,
            data: {
                survey: surveysWithTotalUsers,
                totalCount: result.totalCount,
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
