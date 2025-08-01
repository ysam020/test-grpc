import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import {
    DeleteAdminNotificationRequest__Output,
    DeleteAdminNotificationResponse,
    DeleteAdminNotificationResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { adminNotificationIDType } from '../validations';
import { logger } from '@atc/logger';
import {
    deleteAdminNotificationByID,
    getAdminNotificationByID,
} from '../services/model.service';

export const deleteAdminNotification = async (
    call: CustomServerUnaryCall<
        DeleteAdminNotificationRequest__Output,
        DeleteAdminNotificationResponse
    >,
    callback: sendUnaryData<DeleteAdminNotificationResponse__Output>,
) => {
    try {
        const { admin_notification_id } = utilFns.removeEmptyFields(
            call.request,
        ) as adminNotificationIDType;

        const adminNotification = await getAdminNotificationByID(
            admin_notification_id,
        );
        if (!adminNotification) {
            return callback(null, {
                message: errorMessage.ADMIN_NOTIFICATION.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        await deleteAdminNotificationByID(admin_notification_id);

        return callback(null, {
            message: responseMessage.ADMIN_NOTIFICATION.DELETED,
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
