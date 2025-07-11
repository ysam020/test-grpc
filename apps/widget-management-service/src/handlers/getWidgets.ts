import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetWidgetsRequest__Output,
    GetWidgetsResponse,
    GetWidgetsResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getWidgetsType } from '../validations';
import { getAllWidgets } from '../services/model.service';

export const getWidgets = async (
    call: CustomServerUnaryCall<GetWidgetsRequest__Output, GetWidgetsResponse>,
    callback: sendUnaryData<GetWidgetsResponse__Output>,
) => {
    try {
        const { page, limit } = utilFns.removeEmptyFields(
            call.request,
        ) as getWidgetsType;

        const { widgetsData, totalCount } = await getAllWidgets(
            page,
            limit,
            call.metadata,
        );

        return callback(null, {
            message: responseMessage.WIDGET.RETRIEVED,
            status: status.OK,
            data: { widgets: widgetsData, total_count: totalCount },
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
