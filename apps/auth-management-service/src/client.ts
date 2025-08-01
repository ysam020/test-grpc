import { credentials } from '@grpc/grpc-js';

import { serviceDefinitions } from '@atc/grpc-config';

const userStub = new serviceDefinitions.userPackageDefinition.user.UserService(
    `${process.env.USER_SERVICE_HOST}:${process.env.USER_SERVICE_PORT}`,
    credentials.createInsecure(),
);

const notificationStub =
    new serviceDefinitions.notificationPackageDefinition.notification.NotificationService(
        `${process.env.NOTIFICATION_SERVICE_HOST}:${process.env.NOTIFICATION_SERVICE_PORT}`,
        credentials.createInsecure(),
    );

export { userStub, notificationStub };
