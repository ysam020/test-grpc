import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    FindWidgetsBySampleRequest__Output,
    FindWidgetsBySampleResponse,
    FindWidgetsBySampleResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { findWidgetsBySampleType } from '../validations';
import { getWidgetNamesBySampleID } from '../services/model.service';

export const findWidgetsBySample = async (
    call: CustomServerUnaryCall<
        FindWidgetsBySampleRequest__Output,
        FindWidgetsBySampleResponse
    >,
    callback: sendUnaryData<FindWidgetsBySampleResponse__Output>,
) => {
    try {
        const { sample_id } = utilFns.removeEmptyFields(
            call.request,
        ) as findWidgetsBySampleType;

        const widgetNames = await getWidgetNamesBySampleID(sample_id);

        return callback(null, {
            message: responseMessage.WIDGET.NAME_RETRIEVED,
            status: status.OK,
            data: { widget_names: widgetNames },
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
