import { errorMessage, utilFns, responseMessage } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    CreateSurveyRequest__Output,
    CreateSurveyResponse,
    CreateSurveyResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    createSurvey,
    findSurveyByName,
    getSurveyByID,
    updateSurveyByID,
} from '../services/model.service';
import { prismaClient } from '@atc/db';
import { createSurveyType } from '../validations';

export const CreateSurvey = async (
    call: CustomServerUnaryCall<
        CreateSurveyRequest__Output,
        CreateSurveyResponse
    >,
    callback: sendUnaryData<CreateSurveyResponse__Output>,
) => {
    const {
        name,
        startDate,
        endDate,
        targetAudience,
        hasChildren,
        withEmailSaved,
        is_draft,
        client,
        location,
        state,
        age,
        gender,
        multiSelect,
        question,
        option,
        id,
    } = utilFns.removeEmptyFields(call.request) as createSurveyType;

    try {
        let surveyData: prismaClient.Prisma.SurveyCreateInput = {
            name,
            startDate: startDate,
            endDate: endDate,
            targetAudience,
            location,
            gender: gender || '',
            age,
            state,
            hasChildren: hasChildren || '',
            withEmailSaved: withEmailSaved || '',
        };

        if (client) {
            surveyData = { ...surveyData, client };
        }

        if (is_draft) {
            surveyData = { ...surveyData, is_draft };
        }

        let result;
        if (id) {
            const survey = await getSurveyByID(id);
            if (!survey) {
                return callback(null, {
                    message: errorMessage.SURVEY.NOT_FOUND,
                    status: status.NOT_FOUND,
                });
            }

            if (name !== survey.name) {
                const existingSurvey = await findSurveyByName(name);
                if (existingSurvey) {
                    return callback(null, {
                        message: errorMessage.SURVEY.ALREADY_EXISTS,
                        status: status.ALREADY_EXISTS,
                    });
                }
            }

            result = await updateSurveyByID(id, {
                name,
                startDate: startDate ? startDate.toISOString() : undefined,
                endDate: endDate ? endDate.toISOString() : undefined,
                targetAudience,
                hasChildren,
                withEmailSaved,
                is_draft,
                client,
                location,
                state,
                age,
                gender,
                multiSelect,
                question,
                option,
            });
        } else {
            const existingSurvey = await findSurveyByName(name);
            if (existingSurvey) {
                return callback(null, {
                    message: errorMessage.SURVEY.ALREADY_EXISTS,
                    status: status.ALREADY_EXISTS,
                });
            }

            result = await createSurvey(
                surveyData,
                question,
                multiSelect,
                option,
            );
        }

        if (!result) {
            return callback(null, {
                message: errorMessage.SURVEY.FAILED_TO_CREATE,
                status: status.INTERNAL,
            });
        }

        return callback(null, {
            message: responseMessage.SURVEY.CREATED,
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
