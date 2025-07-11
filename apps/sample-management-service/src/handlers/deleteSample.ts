import {
    constants,
    deleteS3Object,
    errorMessage,
    responseMessage,
    utilFns,
} from '@atc/common';
import { logger } from '@atc/logger';
import {
    deleteSampleByID,
    findSampleOrDraftByID,
} from '../services/model.services';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    DeleteSampleRequest__Output,
    DeleteSampleResponse,
    DeleteSampleResponse__Output,
} from '@atc/proto';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { DeleteSampleType } from '../validations';
import { findWidgetNamesBySampleID } from '../services/client.service';

export const DeleteSample = async (
    call: CustomServerUnaryCall<
        DeleteSampleRequest__Output,
        DeleteSampleResponse
    >,
    callback: sendUnaryData<DeleteSampleResponse__Output>,
) => {
    try {
        const { id } = utilFns.removeEmptyFields(
            call.request,
        ) as DeleteSampleType;

        const sample = await findSampleOrDraftByID(id);
        if (!sample) {
            return callback(null, {
                message: errorMessage.SAMPLE.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const widgetNames = await findWidgetNamesBySampleID(id, call.metadata);
        if ((widgetNames?.widget_names?.length ?? 0) > 0) {
            return callback(null, {
                message: errorMessage.SAMPLE.USED_IN_WIDGET(
                    widgetNames?.widget_names ?? [],
                ),
                status: status.INVALID_ARGUMENT,
            });
        }

        const result = await deleteSampleByID(id, sample);
        if (!result) {
            return callback(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
            });
        }

        if (sample.product && sample.product.image) {
            await deleteS3Object(constants.SAMPLE_PRODUCT_FOLDER, sample.id);
        }

        return callback(null, {
            message: responseMessage.SAMPLE.DELETED,
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
