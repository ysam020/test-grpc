import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetSingleAdminNotificationRequest__Output,
    GetSingleAdminNotificationResponse,
    GetSingleAdminNotificationResponse__Output,
    TargetUsers__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { adminNotificationIDType } from '../validations';
import { getAdminNotificationByID } from '../services/model.service';

export const getSingleAdminNotification = async (
    call: CustomServerUnaryCall<
        GetSingleAdminNotificationRequest__Output,
        GetSingleAdminNotificationResponse
    >,
    callback: sendUnaryData<GetSingleAdminNotificationResponse__Output>,
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
                data: null,
            });
        }

        return callback(null, {
            message: responseMessage.ADMIN_NOTIFICATION.RETRIEVED,
            status: status.OK,
            data: {
                admin_notification_id: adminNotification.id,
                title: adminNotification.title,
                description: adminNotification.description,
                schedule_at: adminNotification.scheduled_at.toISOString(),
                channels: adminNotification.channels as string[],
                target_users:
                    adminNotification.target_users as unknown as TargetUsers__Output,
                status: adminNotification.status,
                createdAt: adminNotification.createdAt.toISOString(),
                updatedAt: adminNotification.updatedAt.toISOString(),
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
