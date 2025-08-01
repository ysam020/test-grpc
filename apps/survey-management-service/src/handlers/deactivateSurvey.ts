import { errorMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import {
    DeactivateSurveyRequest,
    DeactivateSurveyRequest__Output,
    ToggleSurveyResponse,
    ToggleSurveyResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { deactivateSurvey, isActiveSurvey } from '../services/model.service';
import { logger } from '@atc/logger';

export const DeactivateSurvey = async (
    call: CustomServerUnaryCall<
        DeactivateSurveyRequest__Output,
        ToggleSurveyResponse
    >,
    callback: sendUnaryData<ToggleSurveyResponse__Output>,
) => {
    const { id } = utilFns.removeEmptyFields(
        call.request,
    ) as DeactivateSurveyRequest;

    try {
        const isActive = await isActiveSurvey(id);
        if (!isActive) {
            return callback(null, {
                message: errorMessage.SURVEY.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        await deactivateSurvey(id);

        return callback(null, {
            message: errorMessage.SURVEY.DEACTIVATE,
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
