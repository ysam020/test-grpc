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
    getAdminNotificationByID: jest.fn(),
}));

// NOW import everything AFTER the mocks
import { status } from '@grpc/grpc-js';
import { getSingleAdminNotification } from '../../../src/handlers/getSingleAdminNotification';
import { getAdminNotificationByID } from '../../../src/services/model.service';

describe('getSingleAdminNotification Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        mockCall = {
            request: {
                admin_notification_id: 'test-id',
            },
        };
    });

    it('should get admin notification successfully', async () => {
        const mockNotification = {
            id: 'test-id',
            title: 'Test Notification',
            description: 'Test Description',
            status: 'SCHEDULED',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        (getAdminNotificationByID as jest.Mock).mockResolvedValue(
            mockNotification,
        );

        await getSingleAdminNotification(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                status: expect.any(Number),
                message: expect.any(String),
            }),
        );
    });

    it('should return NOT_FOUND when notification does not exist', async () => {
        (getAdminNotificationByID as jest.Mock).mockResolvedValue(null);

        await getSingleAdminNotification(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                status: status.NOT_FOUND,
                message: expect.any(String),
            }),
        );
    });

    it('should handle errors gracefully', async () => {
        (getAdminNotificationByID as jest.Mock).mockRejectedValue(
            new Error('Database error'),
        );

        await getSingleAdminNotification(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'Something went wrong',
                status: status.INTERNAL,
            }),
        );
    });
});
