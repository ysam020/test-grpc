// apps/notification-management-service/__tests__/__mocks__/@atc/grpc-config.js
module.exports = {
    serviceDefinitions: {
        notificationPackageDefinition: {
            notification: {
                NotificationService: {
                    service: {
                        CreateAdminNotification: jest.fn(),
                        UpdateAdminNotification: jest.fn(),
                        GetAdminNotifications: jest.fn(),
                        GetSingleAdminNotification: jest.fn(),
                        DeleteAdminNotification: jest.fn(),
                        AddPriceAlert: jest.fn(),
                        GetPriceAlerts: jest.fn(),
                        DeletePriceAlert: jest.fn(),
                        GetNotifications: jest.fn(),
                        CreateNotification: jest.fn(),
                        RetryAdminNotification: jest.fn(),
                        GetAverageNotificationCount: jest.fn(),
                    },
                },
            },
        },
        userPackageDefinition: {
            user: {
                UserService: jest.fn().mockImplementation(() => ({
                    GetUser: jest.fn(),
                    GetUsers: jest.fn(),
                    CreateUser: jest.fn(),
                    UpdateUser: jest.fn(),
                    DeleteUser: jest.fn(),
                    ValidateUser: jest.fn(),
                })),
            },
        },
        healthPackageDefinition: {
            health: {
                HealthService: {
                    service: {
                        healthCheck: jest.fn(),
                    },
                },
            },
        },
    },
};
