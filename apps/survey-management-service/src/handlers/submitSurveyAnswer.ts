import { CustomServerUnaryCall } from '@atc/grpc-server';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    toggleSurveyByID,
    findAdmin,
    findResponseByQueID,
    findUniqueResponseCount,
    submitAnswerByQueID,
    findSurveyByID,
} from '../services/model.service';
import { errorMessage, responseMessage, sendEmail, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import {
    SubmitSurveyAnswerRequest__Output,
    SubmitSurveyAnswerResponse,
    SubmitSurveyAnswerResponse__Output,
} from '@atc/proto';

export const SubmitSurveyAnswer = async (
    call: CustomServerUnaryCall<
        SubmitSurveyAnswerRequest__Output,
        SubmitSurveyAnswerResponse
    >,
    callback: sendUnaryData<SubmitSurveyAnswerResponse__Output>,
) => {
    const { userID, role, email } = call.user;
    const { id, option } = utilFns.removeEmptyFields(call.request);

    try {
        const survey = await findSurveyByID(id, role);
        if (!survey) {
            return callback(null, {
                message: errorMessage.SURVEY.NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        }

        const response = await findResponseByQueID(survey.question.id, userID);
        if (response.length) {
            return callback(null, {
                message: errorMessage.SURVEY.ALREADY_SUBMITTED_ANSWER,
                status: status.ALREADY_EXISTS,
                data: null,
            });
        }

        if (!survey.question.multiSelect) {
            if (option.length > 1) {
                return callback(null, {
                    message: errorMessage.SURVEY.NOT_SINGLE_SELECTED,
                    status: status.INVALID_ARGUMENT,
                    data: null,
                });
            }
        }

        const invalidOptions = option.filter(
            (opt: any) =>
                !survey.option.some((optInSurvey) => optInSurvey.id === opt),
        );
        if (invalidOptions.length) {
            return callback(null, {
                message: errorMessage.SURVEY.OPTION_NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        }

        const result = await submitAnswerByQueID(
            id,
            survey.question.id,
            option,
            userID,
            survey.withEmailSaved ? email : undefined,
        );
        if (!result) {
            return callback(null, {
                message: errorMessage.SURVEY.FAILED_SUBMIT_ANSWER,
                status: status.INTERNAL,
                data: null,
            });
        }

        const responseCount = await findUniqueResponseCount(id);
        const maximum_responses = survey.targetAudience;

        if (Number(maximum_responses) - Number(responseCount) === 20) {
            const admin = await findAdmin();

            if (!admin) {
                return;
            }

            sendEmail(admin.email, {
                subject: 'Survey Completion Alert',
                text: `${survey.name} survey is nearing its maximum response limit.
                There are only 20 responses remaining before the survey reaches its capacity.
                If you wish to continue collecting responses, you can create a new survey so that all users have the opportunity to provide their input.`,
                html: `
                <p><strong>${survey.name}</strong> is nearing its maximum response limit.</p>
                <p>There are only <strong>20 responses remaining</strong> before the survey reaches its capacity.</p>
                <p>If you wish to continue collecting responses, you can create a new survey so that all users have the opportunity to provide their input.</p>
                <p>Thank you!</p>
            `,
            });
        }

        if (responseCount >= maximum_responses!) {
            await toggleSurveyByID(id, true, true);
        }

        let option_data = survey.option.map((optionData) => {
            const isSelected = option.includes(optionData.id);

            if (isSelected === true) {
                optionData.count = optionData.count + 1;
            }

            return {
                ...optionData,
                user_selected: isSelected,
            };
        });

        const surveyData = {
            option_data,
            total_answered: survey?.totalAnswered + 1 || 0,
        };

        return callback(null, {
            message: responseMessage.SURVEY.SUBMITTED,
            status: status.OK,
            data: surveyData,
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
