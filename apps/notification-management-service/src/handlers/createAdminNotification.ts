import {
    errorMessage,
    eventBridge,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    CreateAdminNotificationRequest__Output,
    CreateAdminNotificationResponse,
    CreateAdminNotificationResponse__Output,
    TargetUsers__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { createAdminNotificationType } from '../validations';
import { addAdminNotification } from '../services/model.service';

export const createAdminNotification = async (
    call: CustomServerUnaryCall<
        CreateAdminNotificationRequest__Output,
        CreateAdminNotificationResponse
    >,
    callback: sendUnaryData<CreateAdminNotificationResponse__Output>,
) => {
    try {
        const {
            title,
            description,
            schedule_date,
            schedule_hour,
            schedule_minute,
            channels,
            target_users,
        } = utilFns.removeEmptyFields(
            call.request,
        ) as createAdminNotificationType;

        const scheduleDate = new Date(schedule_date);
        scheduleDate.setHours(schedule_hour, schedule_minute);

        const adminNotification = await addAdminNotification({
            title,
            description,
            scheduled_at: scheduleDate,
            channels,
            target_users,
        });

        await eventBridge.createEventBridgeSchedule({
            scheduleName: `admin-notification-${adminNotification.id}`,
            scheduleDate: scheduleDate,
            targetArn: process.env.ADMIN_NOTIFICATION_ARN!,
            inputPayload: { adminNotificationID: adminNotification.id },
        });

        return callback(null, {
            message: responseMessage.ADMIN_NOTIFICATION.CREATED,
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
