import {
    AnswerType,
    errorMessage,
    responseMessage,
    SampleType,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    findSampleOrDraftByID,
    publishSampleBYID,
    toggleSampleByID,
} from '../services/model.services';
import {
    ToggleSampleRequest__Output,
    ToggleSampleResponse,
    ToggleSampleResponse__Output,
} from '@atc/proto';
import { ToggleSampleType } from '../validations';

export const ToggleSample = async (
    call: CustomServerUnaryCall<
        ToggleSampleRequest__Output,
        ToggleSampleResponse
    >,
    callback: sendUnaryData<ToggleSampleResponse__Output>,
) => {
    try {
        const { id, type } = utilFns.removeEmptyFields(
            call.request,
        ) as ToggleSampleType;

        const sample = await findSampleOrDraftByID(id, type);
        if (!sample) {
            return callback(null, {
                message: errorMessage.SAMPLE.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        if (type === SampleType.PUBLISHED) {
            await toggleSampleByID({ id, is_active: sample.is_active });
            return callback(null, {
                message: sample.is_active
                    ? responseMessage.SAMPLE.DISABLED
                    : responseMessage.SAMPLE.ENABLED,
                status: status.OK,
            });
        }

        if (type === SampleType.DRAFT) {
            if (
                !sample.product?.product_id ||
                !sample.description ||
                !sample.start_date ||
                !sample.end_date ||
                !sample.maximum_sample ||
                !sample.to_get_product ||
                !sample.task_to_do ||
                !sample.inquiries ||
                !sample.questions ||
                sample.questions.length === 0
            ) {
                return callback(null, {
                    message: errorMessage.OTHER.FILL_REQUIRED_FIELD,
                    status: status.INVALID_ARGUMENT,
                });
            }

            for (const question of sample.questions) {
                if (question.answer_type !== AnswerType.TEXT) {
                    if (!question.options || question.options.length < 2) {
                        return callback(null, {
                            message: errorMessage.SAMPLE.INSUFFICIENT_OPTIONS,
                            status: status.INVALID_ARGUMENT,
                        });
                    }
                }
            }

            await publishSampleBYID(id);

            return callback(null, {
                message: responseMessage.SAMPLE.PUBLISHED,
                status: status.OK,
            });
        }

        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};
