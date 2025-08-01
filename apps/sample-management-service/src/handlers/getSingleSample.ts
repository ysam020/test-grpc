import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { findSampleByID } from '../services/model.services';
import {
    GetSingleSampleRequest__Output,
    GetSingleSampleResponse,
    GetSingleSampleResponse__Output,
} from '@atc/proto';
import { GetSingleSampleType } from '../validations';
import { userStub } from '../client';

export const GetSingleSample = async (
    call: CustomServerUnaryCall<
        GetSingleSampleRequest__Output,
        GetSingleSampleResponse
    >,
    callback: sendUnaryData<GetSingleSampleResponse__Output>,
) => {
    try {
        const { role } = call.user;
        const { id, is_widget_sample } = utilFns.removeEmptyFields(
            call.request,
        ) as GetSingleSampleType;

        let userCount = 0;

        try {
            const { data } = await new Promise<any>((resolve, reject) => {
                userStub.GetUsers(
                    { page: 1, limit: 1 },
                    call.metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

            userCount = data.totalCount;
        } catch (error) {
            throw error;
        }

        let params: any = { id, role };

        if (is_widget_sample) {
            params = { ...params, is_widget_sample };
        }

        const sample = await findSampleByID(params);
        if (!sample) {
            return callback(null, {
                message: errorMessage.SAMPLE.NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        }

        const is_updatable =
            sample.is_draft === true
                ? true
                : new Date(sample.start_date) > new Date();

        const sampleWithTotalUsers = {
            ...sample,
            questions: sample.questions.map((question: any) => ({
                ...question,
                total_users: userCount,
            })),
        };

        return callback(null, {
            message: responseMessage.SAMPLE.RETRIEVED,
            status: status.OK,
            data: {
                ...sampleWithTotalUsers,
                is_updatable,
            },
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
