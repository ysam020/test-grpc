import { jest } from '@jest/globals';

// Mock @atc/common BEFORE any imports (auth-management-service pattern)
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
        USER: {
            NOT_FOUND: 'User not found',
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
        generatePaginationMeta: jest.fn(() => ({
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
        })),
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
    getPriceAlertsByUser: jest.fn(),
    getUserById: jest.fn(),
}));

// NOW import everything AFTER the mocks
import { status } from '@grpc/grpc-js';
import { getPriceAlerts } from '../../../src/handlers/getPriceAlerts';
import {
    getPriceAlertsByUser,
    getUserById,
} from '../../../src/services/model.service';

describe('getPriceAlerts Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        mockCall = {
            request: {
                page: 1,
                limit: 10,
            },
            metadata: {
                get: jest.fn().mockReturnValue(['user-123']),
            },
        };
    });

    it('should get price alerts successfully', async () => {
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
        };

        const mockPriceAlerts = [
            {
                id: 'alert-1',
                target_price: 100.0,
                product_id: 'product-1',
                user_id: 'user-123',
            },
            {
                id: 'alert-2',
                target_price: 50.0,
                product_id: 'product-2',
                user_id: 'user-123',
            },
        ];

        (getUserById as jest.Mock).mockResolvedValue(mockUser);
        (getPriceAlertsByUser as jest.Mock).mockResolvedValue(mockPriceAlerts);

        await getPriceAlerts(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                status: expect.any(Number),
                message: expect.any(String),
            }),
        );
    });

    it('should return NOT_FOUND when user does not exist', async () => {
        (getUserById as jest.Mock).mockResolvedValue(null);

        await getPriceAlerts(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                status: expect.any(Number),
                message: expect.any(String),
            }),
        );
    });

    it('should handle missing user metadata', async () => {
        const mockCallWithoutUser = {
            ...mockCall,
            metadata: {
                get: jest.fn().mockReturnValue([]),
            },
        };

        await getPriceAlerts(mockCallWithoutUser, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'Something went wrong',
                status: status.INTERNAL,
            }),
        );
    });

    it('should handle errors gracefully', async () => {
        (getUserById as jest.Mock).mockRejectedValue(
            new Error('Database error'),
        );

        await getPriceAlerts(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'Something went wrong',
                status: status.INTERNAL,
            }),
        );
    });

    it('should handle pagination parameters', async () => {
        const mockCallWithPagination = {
            ...mockCall,
            request: {
                page: 2,
                limit: 5,
            },
        };

        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
        };

        (getUserById as jest.Mock).mockResolvedValue(mockUser);
        (getPriceAlertsByUser as jest.Mock).mockResolvedValue([]);

        await getPriceAlerts(mockCallWithPagination, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                status: expect.any(Number),
            }),
        );
    });
});
