import {
    errorMessage,
    responseMessage,
    UserRoleEnum,
    UserSampleStatus,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetSampleStatusRequest__Output,
    GetSampleStatusResponse,
    GetSampleStatusResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    findSamplesByIDs,
    getReviewsBySampleIDs,
} from '../services/model.services';

export const getSampleStatus = async (
    call: CustomServerUnaryCall<
        GetSampleStatusRequest__Output,
        GetSampleStatusResponse
    >,
    callback: sendUnaryData<GetSampleStatusResponse__Output>,
) => {
    try {
        const { sample_ids } = call.request;
        const { userID, role } = call.user;

        if (role === UserRoleEnum.ADMIN) {
            const sampleStatuses = sample_ids.map((sample_id) => ({
                sample_id,
                status: UserSampleStatus.NEW_SAMPLE,
            }));

            return callback(null, {
                message: responseMessage.SAMPLE.STATUS_RETRIEVED,
                status: status.OK,
                data: sampleStatuses,
            });
        }

        const samples = await findSamplesByIDs(sample_ids);

        const sampleStatuses = sample_ids.map((sample_id) => ({
            sample_id,
            status: UserSampleStatus.NOT_FOUND,
        }));

        if (!samples || samples.length === 0) {
            return callback(null, {
                message: errorMessage.SAMPLE.NOT_FOUND,
                status: status.NOT_FOUND,
                data: sampleStatuses,
            });
        }

        samples.forEach((sample) => {
            const index = sampleStatuses.findIndex(
                (s) => s.sample_id === sample.id,
            );
            if (index !== -1) {
                sampleStatuses[index]!.status = UserSampleStatus.NEW_SAMPLE;
            }
        });

        const reviews = await getReviewsBySampleIDs(sample_ids, userID);

        reviews.forEach((review) => {
            const index = sampleStatuses.findIndex(
                (s) => s.sample_id === review.sample_id,
            );

            if (index !== -1) {
                if (
                    Number(review.rating) === 0.0 &&
                    review.comment === '' &&
                    review.image === ''
                ) {
                    sampleStatuses[index]!.status = UserSampleStatus.TO_REVIEW;
                }
            } else {
                sampleStatuses[index]!.status = UserSampleStatus.PAST_REVIEW;
            }
        });

        return callback(null, {
            message: responseMessage.SAMPLE.STATUS_RETRIEVED,
            status: status.OK,
            data: sampleStatuses,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
            data: [],
        });
    }
};
