jest.mock('@atc/common', () => ({
    errorMessage: {
        WIDGET: {
            INVALID_DATE_FORMAT: 'Invalid date format',
            BAD_REQUEST: 'Bad request',
        },
        OTHER: {
            BAD_REQUEST: 'Bad request',
            INTERNAL_ERROR: 'Internal error',
            INVALID_INPUT: 'Invalid input',
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
        ADMIN_NOTIFICATION: {
            NOT_FOUND: 'Admin notification not found',
            CREATION_FAILED: 'Failed to create admin notification',
            UPDATE_FAILED: 'Failed to update admin notification',
            DELETE_FAILED: 'Failed to delete admin notification',
        },
        NOTIFICATION: {
            NOT_FOUND: 'Notification not found',
            CREATION_FAILED: 'Failed to create notification',
        },
        PRICE_ALERT: {
            NOT_FOUND: 'Price alert not found',
            ALREADY_EXISTS: 'Price alert already exists',
        },
    },
    responseMessage: {
        ADMIN_NOTIFICATION: {
            CREATED: 'Admin notification created successfully',
            UPDATED: 'Admin notification updated successfully',
            DELETED: 'Admin notification deleted successfully',
            NOT_FOUND: 'Admin notification not found',
            RETRIEVED: 'Admin notifications retrieved successfully',
        },
    },
    status: {
        OK: 0,
        NOT_FOUND: 5,
        INTERNAL: 13,
        INVALID_ARGUMENT: 3,
        ALREADY_EXISTS: 6,
        PERMISSION_DENIED: 7,
    },
    utilFns: {
        removeEmptyFields: jest.fn((obj) => obj),
        validateEmail: jest.fn(() => true),
        validateDate: jest.fn(() => true),
        formatScheduleDate: jest.fn((date, hour, minute) => new Date()),
    },
    eventBridge: {
        createEventBridgeSchedule: jest.fn().mockResolvedValue(true),
        deleteEventBridgeSchedule: jest.fn().mockResolvedValue(true),
        updateEventBridgeSchedule: jest.fn().mockResolvedValue(true),
        getEventBridgeSchedule: jest.fn().mockResolvedValue({}),
    },
    healthCheck: jest.fn().mockResolvedValue({ status: 'SERVING' }),
    NotificationTypeEnum: {
        REGISTRATION: 'REGISTRATION',
        PRICE_ALERT: 'PRICE_ALERT',
        PROMOTION: 'PROMOTION',
        SYSTEM: 'SYSTEM',
        ORDER: 'ORDER',
        PAYMENT: 'PAYMENT',
    },
    AdminNotificationStatusEnum: {
        SCHEDULED: 'SCHEDULED',
        SENT: 'SENT',
        FAILED: 'FAILED',
        CANCELLED: 'CANCELLED',
        PENDING: 'PENDING',
    },
    ChannelEnum: {
        EMAIL: 'EMAIL',
        SMS: 'SMS',
        PUSH: 'PUSH',
        IN_APP: 'IN_APP',
    },
    UserRoleEnum: {
        ADMIN: 'ADMIN',
        USER: 'USER',
        MODERATOR: 'MODERATOR',
    },
}));

// Mock @atc/db
jest.mock('@atc/db', () => ({
    prismaClient: {
        AdminNotificationStatus: {
            SCHEDULED: 'SCHEDULED',
            SENT: 'SENT',
            FAILED: 'FAILED',
            CANCELLED: 'CANCELLED',
            PENDING: 'PENDING',
        },
        NotificationType: {
            REGISTRATION: 'REGISTRATION',
            PRICE_ALERT: 'PRICE_ALERT',
            PROMOTION: 'PROMOTION',
            SYSTEM: 'SYSTEM',
            ORDER: 'ORDER',
            PAYMENT: 'PAYMENT',
        },
        Channel: {
            EMAIL: 'EMAIL',
            SMS: 'SMS',
            PUSH: 'PUSH',
            IN_APP: 'IN_APP',
        },
    },
}));

// Mock @atc/grpc-server - include initializeServer method for the base class
jest.mock('@atc/grpc-server', () => ({
    BaseGrpcServer: jest.fn().mockImplementation(function () {
        this.addMiddleware = jest.fn();
        this.addService = jest.fn();
        this.start = jest.fn().mockResolvedValue(undefined);
        this.stop = jest.fn().mockResolvedValue(undefined);
        this.wrapWithValidation = jest.fn((handler, schema) => handler);
        this.getServer = jest.fn();
        this.initializeServer = jest.fn(); // Add this method to the base class mock
        return this;
    }),
    authMiddleware: jest.fn(() => (call, callback, next) => next()),
    roleMiddleware: jest.fn(() => () => (call, callback, next) => next()),
}));

// Mock @atc/grpc-config
jest.mock('@atc/grpc-config', () => ({
    serviceDefinitions: {
        notificationPackageDefinition: {
            notification: {
                NotificationService: {
                    service: {
                        CreateAdminNotification: {},
                        UpdateAdminNotification: {},
                        GetAdminNotifications: {},
                        GetSingleAdminNotification: {},
                        DeleteAdminNotification: {},
                        AddPriceAlert: {},
                        DeletePriceAlert: {},
                        GetPriceAlerts: {},
                        GetNotifications: {},
                        CreateNotification: {},
                        RetryAdminNotification: {},
                        GetAverageNotificationCount: {},
                    },
                },
            },
        },
        healthPackageDefinition: {
            health: {
                HealthService: {
                    service: {
                        healthCheck: {},
                    },
                },
            },
        },
    },
}));

// Mock @atc/logger
jest.mock('@atc/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        fatal: jest.fn(),
    },
}));

// Mock the handlers
jest.mock('../../../src/handlers', () => ({
    handlers: {
        CreateAdminNotification: jest.fn(),
        UpdateAdminNotification: jest.fn(),
        GetAdminNotifications: jest.fn(),
        GetSingleAdminNotification: jest.fn(),
        DeleteAdminNotification: jest.fn(),
        AddPriceAlert: jest.fn(),
        DeletePriceAlert: jest.fn(),
        GetPriceAlerts: jest.fn(),
        GetNotifications: jest.fn(),
        CreateNotification: jest.fn(),
        RetryAdminNotification: jest.fn(),
        GetAverageNotificationCount: jest.fn(),
    },
}));

// Mock the validations to prevent validation loading issues
jest.mock('../../../src/validations', () => ({
    createAdminNotificationSchema: {},
    updateAdminNotificationSchema: {},
    getAdminNotificationsSchema: {},
    getSingleAdminNotificationSchema: {},
    deleteAdminNotificationSchema: {},
    addPriceAlertSchema: {},
    deletePriceAlertSchema: {},
    getPriceAlertsSchema: {},
    getNotificationsSchema: {},
    createNotificationSchema: {},
    retryAdminNotificationSchema: {},
    getAverageNotificationCountSchema: {},
}));

// NOW import everything AFTER the mocks
import { NotificationServer } from '../../../src/index';

describe('NotificationServer', () => {
    let notificationServer: NotificationServer;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create NotificationServer instance successfully', () => {
        expect(() => {
            notificationServer = new NotificationServer();
        }).not.toThrow();
        expect(notificationServer).toBeInstanceOf(NotificationServer);
    });

    it('should initialize server without errors', () => {
        notificationServer = new NotificationServer();
        // If we get here without throwing, the server initialized successfully
        expect(notificationServer).toBeDefined();
    });

    it('should have proper inheritance from BaseGrpcServer', () => {
        notificationServer = new NotificationServer();
        // Test that the server has the expected methods from BaseGrpcServer
        expect(notificationServer.addMiddleware).toBeDefined();
        expect(notificationServer.addService).toBeDefined();
        expect(notificationServer.start).toBeDefined();
        expect(notificationServer.stop).toBeDefined();
    });
});
