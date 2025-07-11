import {
    errorMessage,
    responseMessage,
    SurveyType,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    disableSurvey,
    toggleSurveyByID,
    findDraftOrSurveyByID,
    findSurveysByIDs,
    publishSurveyByID,
} from '../services/model.service';
import {
    ToggleSurveyRequest__Output,
    ToggleSurveyResponse,
    ToggleSurveyResponse__Output,
} from '@atc/proto';
import { ToggleSurveyType } from '../validations';

export const ToggleSurvey = async (
    call: CustomServerUnaryCall<
        ToggleSurveyRequest__Output,
        ToggleSurveyResponse
    >,
    callback: sendUnaryData<ToggleSurveyResponse__Output>,
) => {
    const { id, type, survey_ids } = utilFns.removeEmptyFields(
        call.request,
    ) as ToggleSurveyType;

    try {
        let message = '';

        if (id && type === SurveyType.DRAFT) {
            const draft = await findDraftOrSurveyByID(id, SurveyType.DRAFT);
            if (!draft) {
                return callback(null, {
                    message: errorMessage.SURVEY.DRAFT_NOT_FOUND,
                    status: status.NOT_FOUND,
                });
            }

            const { name, startDate, endDate, targetAudience, questions } =
                draft;

            if (
                !name ||
                !startDate ||
                !endDate ||
                !targetAudience ||
                !questions ||
                !questions.options ||
                questions.options.length < 2
            ) {
                return callback(null, {
                    message: errorMessage.OTHER.FILL_REQUIRED_FIELD,
                    status: status.CANCELLED,
                });
            }
            await publishSurveyByID(id);

            message = responseMessage.SURVEY.PUBLISHED;
        }

        if (
            survey_ids &&
            survey_ids?.length > 0 &&
            type === SurveyType.PUBLISHED
        ) {
            const surveys = await findSurveysByIDs(
                survey_ids,
                SurveyType.PUBLISHED,
            );
            if (surveys.length !== survey_ids.length) {
                return callback(null, {
                    message: errorMessage.SURVEY.NOT_FOUND,
                    status: status.NOT_FOUND,
                });
            }

            await disableSurvey();

            for (const survey of surveys) {
                await toggleSurveyByID(survey.id, false);
            }

            message = responseMessage.SURVEY.ENABLED;
        }

        return callback(null, {
            message,
            status: status.OK,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
