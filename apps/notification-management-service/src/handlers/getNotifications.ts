import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetNotificationsRequest__Output,
    GetNotificationsResponse,
    GetNotificationsResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getNotificationsType } from '../validations';
import { getAllNotificationsByUserID } from '../services/model.service';
import { prismaClient } from '@atc/db';

export const getNotifications = async (
    call: CustomServerUnaryCall<
        GetNotificationsRequest__Output,
        GetNotificationsResponse
    >,
    callback: sendUnaryData<GetNotificationsResponse__Output>,
) => {
    try {
        const { page, limit } = utilFns.removeEmptyFields(
            call.request,
        ) as getNotificationsType;
        const { userID } = call.user;

        const { notifications, total } = await getAllNotificationsByUserID(
            page,
            limit,
            userID,
            prismaClient.NotificationType.REGISTRATION,
        );

        return callback(null, {
            message: responseMessage.NOTIFICATION.RETRIEVED,
            status: status.OK,
            data: {
                notifications: notifications.map((notification) => ({
                    notification_id: notification.id,
                    title: notification.title,
                    description: notification.description,
                    createdAt: notification.createdAt.toISOString(),
                })),
                total_count: total,
            },
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
            data: {
                notifications: [],
                total_count: 0,
            },
        });
    }
};
