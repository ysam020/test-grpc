import { healthCheck, productValidation, UserRoleEnum } from '@atc/common';
import { serviceDefinitions } from '@atc/grpc-config';
import {
    authMiddleware,
    BaseGrpcServer,
    roleMiddleware,
} from '@atc/grpc-server';
import { handlers } from './handlers';
import {
    createAdminNotificationSchema,
    getAdminNotificationsSchema,
    adminNotificationIDSchema,
    updateAdminNotificationSchema,
    getNotificationsSchema,
    createNotificationSchema,
    addPriceAlertSchema,
    priceAlertIDSchema,
    pageAndLimitSchema,
} from './validations';

export class NotificationServer extends BaseGrpcServer {
    constructor() {
        super();
        this.initializeServer();
    }

    private initializeServer() {
        this.addMiddleware(
            authMiddleware(['/health.HealthService/healthCheck']),
        );

        const roleRequirements = {
            '/notification.NotificationService/CreateAdminNotification': [
                UserRoleEnum.ADMIN,
            ],
            '/notification.NotificationService/UpdateAdminNotification': [
                UserRoleEnum.ADMIN,
            ],
            '/notification.NotificationService/GetSingleAdminNotification': [
                UserRoleEnum.ADMIN,
            ],
            '/notification.NotificationService/DeleteAdminNotification': [
                UserRoleEnum.ADMIN,
            ],
            '/notification.NotificationService/AddPriceAlert': [
                UserRoleEnum.USER,
            ],
            '/notification.NotificationService/DeletePriceAlert': [
                UserRoleEnum.USER,
            ],
            '/notification.NotificationService/GetPriceAlerts': [
                UserRoleEnum.USER,
            ],
            '/notification.NotificationService/GetNotifications': [
                UserRoleEnum.ADMIN,
            ],
            '/notification.NotificationService/CreateNotification': [
                UserRoleEnum.USER,
            ],
            '/notification.NotificationService/RetryAdminNotification': [
                UserRoleEnum.ADMIN,
            ],
            '/notification.NotificationService/GetAverageNotificationCount': [
                UserRoleEnum.ADMIN,
            ],
        };

        this.addMiddleware(roleMiddleware(roleRequirements));

        this.addService(
            serviceDefinitions.notificationPackageDefinition.notification
                .NotificationService.service,
            {
                ...handlers,
                CreateAdminNotification: this.wrapWithValidation(
                    handlers.CreateAdminNotification,
                    createAdminNotificationSchema,
                ),
                UpdateAdminNotification: this.wrapWithValidation(
                    handlers.UpdateAdminNotification,
                    updateAdminNotificationSchema,
                ),
                GetAdminNotifications: this.wrapWithValidation(
                    handlers.GetAdminNotifications,
                    getAdminNotificationsSchema,
                ),
                GetSingleAdminNotification: this.wrapWithValidation(
                    handlers.GetSingleAdminNotification,
                    adminNotificationIDSchema,
                ),
                DeleteAdminNotification: this.wrapWithValidation(
                    handlers.DeleteAdminNotification,
                    adminNotificationIDSchema,
                ),
                AddPriceAlert: this.wrapWithValidation(
                    handlers.AddPriceAlert,
                    addPriceAlertSchema,
                ),
                DeletePriceAlert: this.wrapWithValidation(
                    handlers.DeletePriceAlert,
                    productValidation.productIDSchema,
                ),
                GetNotifications: this.wrapWithValidation(
                    handlers.GetNotifications,
                    getNotificationsSchema,
                ),
                CreateNotification: this.wrapWithValidation(
                    handlers.CreateNotification,
                    createNotificationSchema,
                ),
                RetryAdminNotification: this.wrapWithValidation(
                    handlers.RetryAdminNotification,
                    adminNotificationIDSchema,
                ),
                GetPriceAlerts: this.wrapWithValidation(
                    handlers.GetPriceAlerts,
                    pageAndLimitSchema,
                ),
            },
        );

        this.addService(
            serviceDefinitions.healthPackageDefinition.health.HealthService
                .service,
            { healthCheck },
        );
    }
}
