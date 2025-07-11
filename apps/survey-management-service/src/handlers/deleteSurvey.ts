import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    deleteSurveyByID,
    findDraftOrSurveyByID,
} from '../services/model.service';
import {
    DeleteSurveyRequest__Output,
    DeleteSurveyResponse,
    DeleteSurveyResponse__Output,
} from '@atc/proto';
import { removeSurveyFromWidget } from '../services/client.service';

export const DeleteSurvey = async (
    call: CustomServerUnaryCall<
        DeleteSurveyRequest__Output,
        DeleteSurveyResponse
    >,
    callback: sendUnaryData<DeleteSurveyResponse__Output>,
) => {
    const { id } = utilFns.removeEmptyFields(call.request);

    try {
        const survey = await findDraftOrSurveyByID(id);
        if (!survey) {
            return callback(null, {
                message: errorMessage.SURVEY.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const result = await deleteSurveyByID(id);
        if (!result) {
            return callback(null, {
                message: errorMessage.SURVEY.FAILED_TO_DELETE,
                status: status.INTERNAL,
            });
        }

        await removeSurveyFromWidget(id, call.metadata);

        return callback(null, {
            message: responseMessage.SURVEY.DELETED,
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
