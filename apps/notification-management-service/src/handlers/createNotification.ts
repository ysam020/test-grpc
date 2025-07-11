import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    CreateNotificationRequest__Output,
    CreateNotificationResponse,
    CreateNotificationResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { createNotificationType } from '../validations';
import { addNewNotification } from '../services/model.service';

export const createNotification = async (
    call: CustomServerUnaryCall<
        CreateNotificationRequest__Output,
        CreateNotificationResponse
    >,
    callback: sendUnaryData<CreateNotificationResponse__Output>,
) => {
    try {
        const { title, description, user_id, type } = utilFns.removeEmptyFields(
            call.request,
        ) as createNotificationType;

        await addNewNotification({
            title,
            description,
            User: { connect: { id: user_id } },
            type,
        });

        return callback(null, {
            message: responseMessage.NOTIFICATION.CREATED,
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
