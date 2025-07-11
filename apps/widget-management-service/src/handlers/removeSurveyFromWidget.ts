import { errorMessage, responseMessage } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    RemoveSurveyFromWidgetRequest__Output,
    RemoveSurveyFromWidgetResponse,
    RemoveSurveyFromWidgetResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { removeSurveyFromWidget } from '../services/model.service';

export const RemoveSurveyFromWidget = async (
    call: CustomServerUnaryCall<
        RemoveSurveyFromWidgetRequest__Output,
        RemoveSurveyFromWidgetResponse
    >,
    callback: sendUnaryData<RemoveSurveyFromWidgetResponse__Output>,
) => {
    try {
        const { id } = call.request;

        const result = await removeSurveyFromWidget(id);
        if (!result) {
            return callback(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
            });
        }

        return callback(null, {
            message: responseMessage.SURVEY.REMOVED,
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
