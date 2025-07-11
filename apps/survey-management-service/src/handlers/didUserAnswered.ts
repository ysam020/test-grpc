import { errorMessage, responseMessage } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DidUserAnsweredRequest__Output,
    DidUserAnsweredResponse,
    DidUserAnsweredResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { didUserAnswered } from '../services/model.service';

export const DidUserAnswered = async (
    call: CustomServerUnaryCall<
        DidUserAnsweredRequest__Output,
        DidUserAnsweredResponse
    >,
    callback: sendUnaryData<DidUserAnsweredResponse__Output>,
) => {
    try {
        const { survey_ids } = call.request;
        const { userID } = call.user;

        if (!survey_ids.length) {
            callback(null, {
                data: [],
                message: errorMessage.SURVEY.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const answeredSurvey = await didUserAnswered(survey_ids, userID);
        if (!answeredSurvey.length) {
            callback(null, {
                data: [],
                message: responseMessage.SURVEY.USER_NOT_SUBMITTED,
                status: status.OK,
            });
        }

        const formattedSurveyData = answeredSurvey.map((surv) => ({
            survey_id: surv.survey.id || '',
            did_user_answered:
                surv.question.responses.length > 0 ? true : false,
        }));

        callback(null, {
            data: formattedSurveyData,
            status: status.OK,
            message: responseMessage.SURVEY.USER_SUBMITTED,
        });
    } catch (err) {
        logger.error(err);
        return callback(null, {
            data: [],
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
