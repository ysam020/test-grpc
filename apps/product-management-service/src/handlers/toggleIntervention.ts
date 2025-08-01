import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DefaultResponse,
    DefaultResponse__Output,
    ToggleInterventionRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getSuggestionDetailByID,
    updateSuggestionDetailByID,
} from '../services/model-services';

export const toggleIntervention = async (
    call: CustomServerUnaryCall<
        ToggleInterventionRequest__Output,
        DefaultResponse
    >,
    callback: sendUnaryData<DefaultResponse__Output>,
) => {
    try {
        const { suggestion_id } = utilFns.removeEmptyFields(call.request);

        const suggestionDetail = await getSuggestionDetailByID(suggestion_id);
        if (!suggestionDetail) {
            return callback(null, {
                message: errorMessage.PRODUCT.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        await updateSuggestionDetailByID(suggestion_id, {
            intervention: !suggestionDetail.intervention,
        });

        return callback(null, {
            message: responseMessage.PRODUCT.TOGGLE_INTERVENTION,
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
