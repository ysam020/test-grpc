// apps/notification-management-service/__tests__/unit/handlers/getNotifications.test.ts
import { status } from '@grpc/grpc-js';
import { getNotifications } from '../../../src/handlers/getNotifications';
import { getNotificationsWithPagination } from '../../../src/services/model.service';

jest.mock('../../../src/services/model.service');
jest.mock('@atc/common', () => ({
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
    errorMessage: {
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        NOTIFICATION: {
            FETCHED: 'Notifications fetched successfully',
        },
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

const { utilFns } = require('@atc/common');

describe('getNotifications Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        mockCall = {
            request: {
                page: '1',
                limit: '10',
                user_id: 'user-123',
                type: 'REGISTRATION',
            },
        };
    });

    it('should fetch notifications successfully', async () => {
        const mockNotifications = [
            {
                id: 'notification-1',
                title: 'Test Notification',
                description: 'Test Description',
                type: 'REGISTRATION',
                user_id: 'user-123',
                read: false,
                createdAt: new Date(),
            },
        ];

        const mockResult = {
            notifications: mockNotifications,
            total: 1,
        };

        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getNotificationsWithPagination as jest.Mock).mockResolvedValue(
            mockResult,
        );

        await getNotifications(mockCall, mockCallback);

        expect(getNotificationsWithPagination).toHaveBeenCalledWith({
            page: 1,
            limit: 10,
            user_id: 'user-123',
            type: 'REGISTRATION',
        });

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Notifications fetched successfully',
            status: status.OK,
            data: {
                notifications: mockNotifications,
                total: 1,
                page: 1,
                limit: 10,
            },
        });
    });

    it('should handle errors gracefully', async () => {
        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getNotificationsWithPagination as jest.Mock).mockRejectedValue(
            new Error('Database error'),
        );

        await getNotifications(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Something went wrong',
            status: status.INTERNAL,
        });
    });
});
