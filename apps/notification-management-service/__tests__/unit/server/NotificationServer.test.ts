// apps/notification-management-service/__tests__/unit/server/NotificationServer.test.ts
import { NotificationServer } from '../../../src/index';

jest.mock('@atc/grpc-server', () => ({
    BaseGrpcServer: class MockBaseGrpcServer {
        addMiddleware = jest.fn();
        addService = jest.fn();
        wrapWithValidation = jest.fn((handler, schema) => handler);
    },
    authMiddleware: jest.fn(),
    roleMiddleware: jest.fn(),
}));

jest.mock('@atc/common', () => ({
    healthCheck: jest.fn(),
    productValidation: {
        productIDSchema: {},
    },
    UserRoleEnum: {
        ADMIN: 'ADMIN',
        USER: 'USER',
    },
}));

jest.mock('@atc/grpc-config', () => ({
    serviceDefinitions: {
        notificationPackageDefinition: {
            notification: {
                NotificationService: {
                    service: {},
                },
            },
        },
        healthPackageDefinition: {
            health: {
                HealthService: {
                    service: {},
                },
            },
        },
    },
}));

jest.mock('../../../src/handlers', () => ({
    handlers: {
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
}));

const { authMiddleware, roleMiddleware } = require('@atc/grpc-server');

describe('NotificationServer', () => {
    let server: NotificationServer;

    beforeEach(() => {
        jest.clearAllMocks();
        server = new NotificationServer();
    });

    it('should initialize server with middlewares', () => {
        expect(authMiddleware).toHaveBeenCalledWith([
            '/health.HealthService/healthCheck',
        ]);
        expect(roleMiddleware).toHaveBeenCalledWith(
            expect.objectContaining({
                '/notification.NotificationService/CreateAdminNotification': [
                    'ADMIN',
                ],
                '/notification.NotificationService/UpdateAdminNotification': [
                    'ADMIN',
                ],
                '/notification.NotificationService/GetSingleAdminNotification':
                    ['ADMIN'],
                '/notification.NotificationService/DeleteAdminNotification': [
                    'ADMIN',
                ],
                '/notification.NotificationService/AddPriceAlert': ['USER'],
                '/notification.NotificationService/DeletePriceAlert': ['USER'],
                '/notification.NotificationService/GetPriceAlerts': ['USER'],
                '/notification.NotificationService/GetNotifications': ['ADMIN'],
                '/notification.NotificationService/CreateNotification': [
                    'USER',
                ],
                '/notification.NotificationService/RetryAdminNotification': [
                    'ADMIN',
                ],
                '/notification.NotificationService/GetAverageNotificationCount':
                    ['ADMIN'],
            }),
        );
    });

    it('should add notification service with handlers', () => {
        expect(server.addService).toHaveBeenCalledTimes(2);
    });
});
