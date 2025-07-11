import { CustomServerUnaryCall } from '@atc/grpc-server';
import {
    Empty__Output,
    GetActiveWidgetResponse,
    GetActiveWidgetResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getAllWidgets } from '../services/model.service';
import { errorMessage, responseMessage } from '@atc/common';
import { logger } from '@atc/logger';

export const getActiveWidget = async (
    call: CustomServerUnaryCall<Empty__Output, GetActiveWidgetResponse>,
    callback: sendUnaryData<GetActiveWidgetResponse__Output>,
) => {
    try {
        const { widgetsData } = await getAllWidgets(
            1,
            1,
            call.metadata,
            undefined,
            true,
        );

        if (!widgetsData[0]) {
            return callback(null, {
                message: errorMessage.WIDGET.NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        }

        return callback(null, {
            message: responseMessage.WIDGET.RETRIEVED,
            status: status.OK,
            data: widgetsData[0],
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
