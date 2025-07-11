import {
    errorMessage,
    eventBridge,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    TargetUsers__Output,
    UpdateAdminNotificationRequest__Output,
    UpdateAdminNotificationResponse,
    UpdateAdminNotificationResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { updateAdminNotificationType } from '../validations';
import { prismaClient } from '@atc/db';
import {
    getAdminNotificationByID,
    updateAdminNotificationByID,
} from '../services/model.service';

export const updateAdminNotification = async (
    call: CustomServerUnaryCall<
        UpdateAdminNotificationRequest__Output,
        UpdateAdminNotificationResponse
    >,
    callback: sendUnaryData<UpdateAdminNotificationResponse__Output>,
) => {
    try {
        const {
            admin_notification_id,
            title,
            description,
            schedule_date,
            schedule_hour,
            schedule_minute,
            channels,
            target_users,
        } = utilFns.removeEmptyFields(
            call.request,
        ) as updateAdminNotificationType;

        const notificationData: prismaClient.Prisma.AdminNotificationUpdateInput =
            {};

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

        if (
            adminNotification.status !==
            prismaClient.AdminNotificationStatus.PENDING
        ) {
            return callback(null, {
                message: errorMessage.ADMIN_NOTIFICATION.ALREADY_SENT,
                status: status.FAILED_PRECONDITION,
                data: null,
            });
        }

        if (title) {
            notificationData['title'] = title;
        }
        if (description) {
            notificationData['description'] = description;
        }
        if (
            schedule_date &&
            schedule_hour !== undefined &&
            schedule_minute !== undefined
        ) {
            const scheduleDate = new Date(schedule_date);
            scheduleDate.setHours(schedule_hour, schedule_minute);

            notificationData['scheduled_at'] = scheduleDate;

            const params = {
                scheduleName: `admin-notification-${adminNotification.id}`,
                scheduleDate: scheduleDate,
                targetArn: process.env.ADMIN_NOTIFICATION_ARN!,
                inputPayload: { adminNotificationID: adminNotification.id },
            };
            const scheduleExists = await eventBridge.checkScheduleExists(
                params.scheduleName,
            );

            if (scheduleExists) {
                await eventBridge.updateEventBridgeSchedule(params);
            } else {
                await eventBridge.createEventBridgeSchedule(params);
            }
        }
        if (channels) {
            notificationData['channels'] = channels;
        }
        if (target_users) {
            notificationData['target_users'] = target_users;
        }

        const updatedAdminNotification = await updateAdminNotificationByID(
            admin_notification_id,
            notificationData,
        );

        return callback(null, {
            message: responseMessage.ADMIN_NOTIFICATION.UPDATED,
            status: status.OK,
            data: {
                admin_notification_id: updatedAdminNotification.id,
                title: updatedAdminNotification.title,
                description: updatedAdminNotification.description,
                schedule_at:
                    updatedAdminNotification.scheduled_at.toISOString(),
                channels: updatedAdminNotification.channels as string[],
                target_users:
                    updatedAdminNotification.target_users as unknown as TargetUsers__Output,
                status: updatedAdminNotification.status,
                createdAt: updatedAdminNotification.createdAt.toISOString(),
                updatedAt: updatedAdminNotification.updatedAt.toISOString(),
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
