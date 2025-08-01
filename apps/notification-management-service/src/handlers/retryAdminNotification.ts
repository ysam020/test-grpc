import {
    errorMessage,
    responseMessage,
    sendEmail,
    snsHelper,
    utilFns,
} from '@atc/common';
import { logger } from '@atc/logger';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { adminNotificationIDType } from '../validations';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import {
    RetryAdminNotificationRequest__Output,
    RetryAdminNotificationResponse,
    RetryAdminNotificationResponse__Output,
} from '@atc/proto';
import {
    getFailedNotifications,
    markNotificationsAsSent,
    updateAdminNotificationByID,
} from '../services/model.service';
import { prismaClient } from '@atc/db';

export const retryAdminNotification = async (
    call: CustomServerUnaryCall<
        RetryAdminNotificationRequest__Output,
        RetryAdminNotificationResponse
    >,
    callback: sendUnaryData<RetryAdminNotificationResponse__Output>,
) => {
    try {
        const { admin_notification_id } = utilFns.removeEmptyFields(
            call.request,
        ) as adminNotificationIDType;

        const failedNotifications = await getFailedNotifications(
            admin_notification_id,
        );
        if (failedNotifications.length < 1) {
            return callback(null, {
                message:
                    errorMessage.ADMIN_NOTIFICATION.NO_FAILED_NOTIFICATIONS,
                status: status.NOT_FOUND,
            });
        }

        const topicName = `retry_notification_${admin_notification_id}`;
        const topicArn = await snsHelper.createTopic(topicName);

        let sentNotificationIDs: string[] = [];
        for (const notification of failedNotifications) {
            const { email, phone_number, device_endpoint_arn } =
                notification.User;

            switch (notification.channel) {
                case prismaClient.NotificationChannel.EMAIL:
                    if (email) {
                        await sendEmail(email, {
                            subject: notification.title,
                            text: notification.description,
                            html: notification.description,
                        });
                        sentNotificationIDs.push(notification.id);
                    }
                    break;

                case prismaClient.NotificationChannel.SMS:
                    if (phone_number) {
                        await snsHelper.subscribe(
                            topicArn,
                            'sms',
                            phone_number,
                        );
                        sentNotificationIDs.push(notification.id);
                    }
                    break;

                case prismaClient.NotificationChannel.PUSH_NOTIFICATION:
                    if (device_endpoint_arn) {
                        await snsHelper.subscribe(
                            topicArn,
                            'application',
                            device_endpoint_arn,
                        );
                        sentNotificationIDs.push(notification.id);
                    }
                    break;

                // TODO case prismaClient.NotificationChannel.WHATSAPP
            }
        }

        if (sentNotificationIDs.length > 0) {
            try {
                const description = failedNotifications[0]!.description;
                const title = failedNotifications[0]!.title;
                const message = {
                    default: description,
                    SMS: description,
                    GCM: JSON.stringify({
                        notification: {
                            title,
                            body: description,
                        },
                        data: {
                            type: prismaClient.NotificationType
                                .ADMIN_NOTIFICATION,
                        },
                    }),
                    APNS: JSON.stringify({
                        aps: {
                            alert: {
                                title,
                                body: description,
                            },
                        },
                        type: prismaClient.NotificationType.ADMIN_NOTIFICATION,
                    }),
                };

                await snsHelper.publishToTopic(topicArn, message);
            } catch (error) {
                logger.error('Error publishing to SNS topic', error);
            }

            await markNotificationsAsSent(sentNotificationIDs);

            if (sentNotificationIDs.length === failedNotifications.length) {
                await updateAdminNotificationByID(admin_notification_id, {
                    status: prismaClient.AdminNotificationStatus.SENT,
                });
            }
        }

        await snsHelper.deleteTopic(topicArn);

        return callback(null, {
            message: responseMessage.ADMIN_NOTIFICATION.RETRY_SUCCESS,
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
