import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DeleteWidgetRequest__Output,
    DeleteWidgetResponse,
    DeleteWidgetResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { widgetIDType } from '../validations';
import { deleteWidgetByID, getWidgetByID } from '../services/model.service';
import { prismaClient } from '@atc/db';

export const deleteWidget = async (
    call: CustomServerUnaryCall<
        DeleteWidgetRequest__Output,
        DeleteWidgetResponse
    >,
    callback: sendUnaryData<DeleteWidgetResponse__Output>,
) => {
    try {
        const { widget_id } = utilFns.removeEmptyFields(
            call.request,
        ) as widgetIDType;

        const widget = await getWidgetByID(widget_id);
        if (!widget) {
            return callback(null, {
                message: errorMessage.WIDGET.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        if (widget.status === prismaClient.WidgetStatusEnum.ACTIVE) {
            return callback(null, {
                message: errorMessage.WIDGET.ACTIVE_CANNOT_DELETE,
                status: status.FAILED_PRECONDITION,
            });
        }

        await deleteWidgetByID(widget_id);

        return callback(null, {
            message: responseMessage.WIDGET.DELETED,
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
