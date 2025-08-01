import {
    constants,
    errorMessage,
    putS3Object,
    responseMessage,
    utilFns,
} from '@atc/common';
import { logger } from '@atc/logger';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    createReviewByID,
    findSampleToReview,
} from '../services/model.services';
import {
    ReviewSampleRequest__Output,
    ReviewSampleResponse,
    ReviewSampleResponse__Output,
} from '@atc/proto';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { ReviewSampleType } from '../validations';

export const ReviewSample = async (
    call: CustomServerUnaryCall<
        ReviewSampleRequest__Output,
        ReviewSampleResponse
    >,
    callback: sendUnaryData<ReviewSampleResponse__Output>,
) => {
    try {
        const { userID } = call.user;
        const { id, rating, comment, image, mime_type, content_length } =
            utilFns.removeEmptyFields(call.request) as ReviewSampleType;

        const sample = await findSampleToReview(id);
        if (!sample) {
            return callback(null, {
                message: errorMessage.SAMPLE.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        let reviewData: any = {
            rating: rating ?? null,
            comment: comment ?? '',
            user_id: userID,
            sample_id: id,
        };

        if (image) {
            await putS3Object(
                constants.REVIEW_IMAGE_FOLDER,
                image,
                sample.id,
                mime_type,
                content_length,
            );

            const review = await createReviewByID(id, reviewData, userID);
            reviewData = { ...reviewData, image: review.id };
        }

        const result = await createReviewByID(id, reviewData, userID);
        if (!result) {
            return callback(null, {
                message: errorMessage.SAMPLE.FAILED_TO_REVIEW,
                status: status.INTERNAL,
            });
        }

        return callback(null, {
            message: responseMessage.SAMPLE.REVIEW_ADDED,
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
