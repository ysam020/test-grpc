import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { findAllReviews } from '../services/model.services';
import {
    GetAllReviewRequest__Output,
    GetAllReviewResponse,
    GetAllReviewResponse__Output,
} from '@atc/proto';
import { GetAllReviewType } from '../validations';
import { userStub } from '../client';

export const GetAllReview = async (
    call: CustomServerUnaryCall<
        GetAllReviewRequest__Output,
        GetAllReviewResponse
    >,
    callback: sendUnaryData<GetAllReviewResponse__Output>,
) => {
    try {
        const { userID } = call.user;
        const { type, page, limit } = utilFns.removeEmptyFields(
            call.request,
        ) as GetAllReviewType;

        let userData;

        try {
            userData = await new Promise<any>((resolve, reject) => {
                userStub.GetSingleUser(
                    { id: userID },
                    call.metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });
        } catch (error) {
            throw error;
        }

        const { reviews, totalCount } = await findAllReviews(
            userID,
            page,
            limit,
            userData.createdAt!,
            type,
        );

        return callback(null, {
            message: responseMessage.SAMPLE.REVIEW_RETRIVED,
            status: status.OK,
            data: { reviews: reviews, total_count: totalCount },
        });
    } catch (error) {
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
            data: null,
        });
    }
};
