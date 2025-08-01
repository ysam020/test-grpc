import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import { UpdateSurveyRequest__Output, UpdateSurveyResponse } from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    findDraftOrSurveyByID,
    findSurveyByName,
    updateSurveyByID,
} from '../services/model.service';
import { UpdateSurveyRequest } from '@atc/proto';

export const UpdateSurvey = async (
    call: CustomServerUnaryCall<
        UpdateSurveyRequest__Output,
        UpdateSurveyResponse
    >,
    callback: sendUnaryData<UpdateSurveyResponse>,
) => {
    const {
        id,
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
    } = utilFns.removeEmptyFields(call.request);

    try {
        const survey = await findDraftOrSurveyByID(id);
        if (!survey) {
            return callback(null, {
                message: errorMessage.SURVEY.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        if (!survey.is_draft) {
            return callback(null, {
                message: errorMessage.SURVEY.CANNOT_UPDATE_PUBLISHED,
                status: status.FAILED_PRECONDITION,
            });
        }

        if (name && name !== survey.name) {
            const survey = await findSurveyByName(name);
            if (survey) {
                return callback(null, {
                    message: errorMessage.SURVEY.ALREADY_EXISTS,
                    status: status.ALREADY_EXISTS,
                });
            }
        }

        if (!survey.questions && !question && option.length > 0) {
            return callback(null, {
                message: errorMessage.SURVEY.QUESTION_REQUIRED_BEFORE_OPTION,
                status: status.INVALID_ARGUMENT,
            });
        }

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return callback(null, {
                message: errorMessage.DATE.DATE_BEFORE_START,
                status: status.INVALID_ARGUMENT,
            });
        }

        const updateData: UpdateSurveyRequest = {
            name,
            startDate,
            endDate,
            targetAudience,
            hasChildren,
            withEmailSaved,
            is_draft,
            client,
            location: location.length > 0 ? location : undefined,
            state: state.length > 0 ? state : undefined,
            age: age.length > 0 ? age : undefined,
            gender: gender.length > 0 ? gender : undefined,
            multiSelect,
            question,
            option: option.length > 0 ? option : undefined,
        };

        const result = await updateSurveyByID(id, updateData);
        if (!result) {
            return callback(null, {
                message: errorMessage.SURVEY.FAILED_TO_UPDATE,
                status: status.INTERNAL,
            });
        }

        return callback(null, {
            message: responseMessage.SURVEY.UPDATED,
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
