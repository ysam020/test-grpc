import {
    getPotentialMatchListRequest__Output,
    getPotentialMatchListResponse,
    getPotentialMatchListResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { getPotentialMatchList } from '../services/model-services';

export const getPotentialMatchListHandler = async (
    call: ServerUnaryCall<
        getPotentialMatchListRequest__Output,
        getPotentialMatchListResponse
    >,
    callback: sendUnaryData<getPotentialMatchListResponse__Output>,
) => {
    try {
        const { keyword, page, limit, sort_by_order, intervention } =
            utilFns.removeEmptyFields(
                call.request,
            ) as getPotentialMatchListRequest__Output;

        if (!page || !limit) {
            return callback(null, {
                data: null,
                message: errorMessage.PRODUCT.PROVIDE_VALID_PARAMETER_VALUE,
                status: status.CANCELLED,
            });
        }

        const { potentialMatchesData, totalCount } =
            await getPotentialMatchList(
                keyword,
                sort_by_order,
                page,
                limit,
                intervention,
            );

        if (!potentialMatchesData || !potentialMatchesData.length) {
            return callback(null, {
                data: {
                    product_list: [],
                    total_count: 0,
                },
                message: errorMessage.PRODUCT.NOT_FOUND,
                status: status.OK,
            });
        }

        return callback(null, {
            data: {
                product_list: potentialMatchesData,
                total_count: totalCount,
            },
            message: responseMessage.PRODUCT.SUCCESS,
            status: status.OK,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            data: null,
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
