import {
    errorMessage,
    responseMessage,
    UserRoleEnum,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetSingleSurveyRequest__Output,
    GetSingleSurveyResponse,
    GetSingleSurveyResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    findResponsesByUserID,
    findSurveyByID,
} from '../services/model.service';

export const GetSingleSurvey = async (
    call: CustomServerUnaryCall<
        GetSingleSurveyRequest__Output,
        GetSingleSurveyResponse
    >,
    callback: sendUnaryData<GetSingleSurveyResponse__Output>,
) => {
    const { userID, role } = call.user;
    const { id, is_widget_survey } = utilFns.removeEmptyFields(call.request);

    try {
        const survey = await findSurveyByID(
            id,
            role === UserRoleEnum.USER ? role : undefined,
            is_widget_survey,
        );
        if (!survey) {
            return callback(null, {
                message: errorMessage.SURVEY.NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        }

        let responses;

        if (role === UserRoleEnum.USER) {
            responses = await findResponsesByUserID(survey.question.id, userID);
        }

        const is_updatable =
            survey.is_draft === true
                ? true
                : new Date(survey.startDate) > new Date();

        return callback(null, {
            message: responseMessage.SURVEY.RETRIEVED,
            status: status.OK,
            data: { ...survey, is_updatable, responses: responses || [] },
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
