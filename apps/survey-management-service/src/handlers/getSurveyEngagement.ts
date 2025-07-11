import { ChartType, errorMessage, responseMessage } from '@atc/common';
import { helperQueries } from '@atc/db';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import {
    ChartData__Output,
    GetSurveyEngagementRequest__Output,
    GetSurveyEngagementResponse,
    GetSurveyEngagementResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';

export const getSurveyEngagement = async (
    call: CustomServerUnaryCall<
        GetSurveyEngagementRequest__Output,
        GetSurveyEngagementResponse
    >,
    callback: sendUnaryData<GetSurveyEngagementResponse__Output>,
) => {
    try {
        const { type } = call.request;

        let data: ChartData__Output[] = [];

        if (type === ChartType.MONTHLY) {
            data = (await helperQueries.getMonthlyRecordCounts(
                'SurveyResponse',
            )) as unknown as ChartData__Output[];
        }

        if (type === ChartType.YEARLY) {
            data = (await helperQueries.getYearlyRecordCounts(
                'SurveyResponse',
            )) as unknown as ChartData__Output[];
        }

        if (type === ChartType.WEEKLY) {
            data = (await helperQueries.getWeeklyRecordCounts(
                'SurveyResponse',
            )) as unknown as ChartData__Output[];
        }

        return callback(null, {
            data: data,
            status: status.OK,
            message: data.length
                ? responseMessage.OTHER.DATA_FOUND
                : responseMessage.OTHER.DATA_NOT_FOUND,
        });
    } catch (error) {
        console.log(error);
        return callback(null, {
            data: [],
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
