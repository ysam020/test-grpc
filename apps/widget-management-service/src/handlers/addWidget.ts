import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';

import { sendUnaryData, status } from '@grpc/grpc-js';
import { checkWidgetNameExists, createWidget } from '../services/model.service';
import {
    AddWidgetRequest__Output,
    AddWidgetResponse,
    AddWidgetResponse__Output,
} from '@atc/proto';
import { addWidgetType } from '../validations';

export const addWidget = async (
    call: CustomServerUnaryCall<AddWidgetRequest__Output, AddWidgetResponse>,
    callback: sendUnaryData<AddWidgetResponse__Output>,
) => {
    try {
        const { widget_name } = utilFns.removeEmptyFields(
            call.request,
        ) as addWidgetType;

        const widgetNameExists = await checkWidgetNameExists(widget_name);
        if (widgetNameExists) {
            return callback(null, {
                message: errorMessage.WIDGET.WIDGET_NAME_EXISTS,
                data: null,
                status: status.INVALID_ARGUMENT,
            });
        }

        const widget = await createWidget({ widget_name });

        return callback(null, {
            message: responseMessage.WIDGET.CREATED,
            status: status.OK,
            data: {
                id: widget.id,
                widget_name: widget.widget_name,
            },
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            data: null,
            status: status.INTERNAL,
        });
    }
};
