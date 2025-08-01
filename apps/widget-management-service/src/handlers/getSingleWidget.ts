import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetSingleWidgetRequest__Output,
    GetSingleWidgetResponse,
    GetSingleWidgetResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { widgetIDType } from '../validations';
import { getAllWidgets } from '../services/model.service';

export const getSingleWidget = async (
    call: CustomServerUnaryCall<
        GetSingleWidgetRequest__Output,
        GetSingleWidgetResponse
    >,
    callback: sendUnaryData<GetSingleWidgetResponse__Output>,
) => {
    try {
        const { widget_id } = utilFns.removeEmptyFields(
            call.request,
        ) as widgetIDType;

        const { widgetsData } = await getAllWidgets(
            1,
            1,
            call.metadata,
            widget_id,
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
