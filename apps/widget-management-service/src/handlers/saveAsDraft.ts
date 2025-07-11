import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    SaveAsDraftRequest__Output,
    SaveAsDraftResponse,
    SaveAsDraftResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getWidgetByID,
    updateWidgetComponentOrders,
} from '../services/model.service';
import { saveAsDraftType } from '../validations';

export const saveAsDraft = async (
    call: CustomServerUnaryCall<
        SaveAsDraftRequest__Output,
        SaveAsDraftResponse
    >,
    callback: sendUnaryData<SaveAsDraftResponse__Output>,
) => {
    try {
        const { widget_id, component_orders } = utilFns.removeEmptyFields(
            call.request,
        ) as saveAsDraftType;

        const widget = await getWidgetByID(widget_id);
        if (!widget) {
            return callback(null, {
                message: errorMessage.WIDGET.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        await updateWidgetComponentOrders(component_orders);

        return callback(null, {
            message: responseMessage.WIDGET.SAVED,
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
