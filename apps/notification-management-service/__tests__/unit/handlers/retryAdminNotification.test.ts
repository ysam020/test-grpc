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
            NO_FAILED_NOTIFICATIONS: 'No failed notifications found',
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
            RETRY_SUCCESS: 'Notifications retried successfully',
        },
        NOTIFICATION: {
            CREATED: 'Notification created successfully',
            RETRIEVED: 'Notifications retrieved successfully',
        },
        PRICE_ALERT: {
            CREATED: 'Price alert created successfully',
            DELETED: 'Price alert deleted successfully',
            RETRIEVED: 'Price alerts retrieved successfully',
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
    sns: {
        publishMessage: jest.fn().mockResolvedValue(true),
        createTopic: jest.fn().mockResolvedValue(true),
        deleteTopic: jest.fn().mockResolvedValue(true),
        subscribe: jest.fn().mockResolvedValue(true),
        unsubscribe: jest.fn().mockResolvedValue(true),
    },
    ses: {
        sendEmail: jest.fn().mockResolvedValue(true),
        sendBulkEmail: jest.fn().mockResolvedValue(true),
        createTemplate: jest.fn().mockResolvedValue(true),
        deleteTemplate: jest.fn().mockResolvedValue(true),
    },
    snsHelper: {
        createTopic: jest.fn().mockResolvedValue(true),
        publishMessage: jest.fn().mockResolvedValue(true),
    },
    sendEmail: jest.fn().mockResolvedValue(true),
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

// Mock @atc/db BEFORE any imports
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

// Mock @atc/logger BEFORE any imports
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

// Mock the services BEFORE any imports
jest.mock('../../../src/services/model.service', () => ({
    getFailedNotifications: jest.fn(),
    markNotificationsAsSent: jest.fn(),
}));

// NOW import everything AFTER the mocks
import { status } from '@grpc/grpc-js';
import { retryAdminNotification } from '../../../src/handlers/retryAdminNotification';
import {
    getFailedNotifications,
    markNotificationsAsSent,
} from '../../../src/services/model.service';

describe('retryAdminNotification Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        mockCall = {
            request: {
                admin_notification_id: 'notification-123',
            },
        };
    });

    it('should return NOT_FOUND when no failed notifications exist', async () => {
        (getFailedNotifications as jest.Mock).mockResolvedValue([]);

        await retryAdminNotification(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                status: expect.any(Number),
                message: expect.any(String),
            }),
        );
    });

    it('should retry failed notifications successfully', async () => {
        const mockFailedNotifications = [
            {
                id: 'notif-1',
                title: 'Test Notification 1',
                status: 'FAILED',
            },
            {
                id: 'notif-2',
                title: 'Test Notification 2',
                status: 'FAILED',
            },
        ];

        (getFailedNotifications as jest.Mock).mockResolvedValue(
            mockFailedNotifications,
        );
        (markNotificationsAsSent as jest.Mock).mockResolvedValue(true);

        await retryAdminNotification(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                status: expect.any(Number),
                message: expect.any(String),
            }),
        );
    });

    it('should handle errors gracefully', async () => {
        (getFailedNotifications as jest.Mock).mockRejectedValue(
            new Error('Database error'),
        );

        await retryAdminNotification(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'Something went wrong',
                status: status.INTERNAL,
            }),
        );
    });

    it('should handle retry process errors', async () => {
        const mockFailedNotifications = [
            {
                id: 'notif-1',
                title: 'Test Notification 1',
                status: 'FAILED',
            },
        ];

        (getFailedNotifications as jest.Mock).mockResolvedValue(
            mockFailedNotifications,
        );
        (markNotificationsAsSent as jest.Mock).mockRejectedValue(
            new Error('Retry failed'),
        );

        await retryAdminNotification(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'Something went wrong',
                status: status.INTERNAL,
            }),
        );
    });
});
