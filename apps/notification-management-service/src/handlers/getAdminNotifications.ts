import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetAdminNotificationsRequest__Output,
    GetAdminNotificationsResponse,
    GetAdminNotificationsResponse__Output,
    TargetUsers__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getAdminNotificationsType } from '../validations';
import { getAllAdminNotifications } from '../services/model.service';

export const getAdminNotifications = async (
    call: CustomServerUnaryCall<
        GetAdminNotificationsRequest__Output,
        GetAdminNotificationsResponse
    >,
    callback: sendUnaryData<GetAdminNotificationsResponse__Output>,
) => {
    try {
        const {
            page,
            limit,
            status: notificationStatus,
            start_date,
            end_date,
        } = utilFns.removeEmptyFields(
            call.request,
        ) as getAdminNotificationsType;

        const { adminNotifications, total } = await getAllAdminNotifications(
            page,
            limit,
            notificationStatus,
            start_date,
            end_date,
        );

        return callback(null, {
            message: responseMessage.ADMIN_NOTIFICATION.RETRIEVED,
            status: status.OK,
            data: {
                admin_notifications: adminNotifications.map(
                    (adminNotification) => ({
                        admin_notification_id:
                            adminNotification.admin_notification_id,
                        title: adminNotification.title,
                        description: adminNotification.description,
                        schedule_at:
                            adminNotification.scheduled_at.toISOString(),
                        channels: adminNotification.channels as string[],
                        status: adminNotification.status,
                        target_users:
                            adminNotification.target_users as unknown as TargetUsers__Output,
                        createdAt: adminNotification.createdAt.toISOString(),
                        updatedAt: adminNotification.updatedAt.toISOString(),
                        no_of_users: Number(adminNotification.no_of_users),
                        sent_count: Number(adminNotification.sent_count),
                    }),
                ),
                total_count: total,
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
