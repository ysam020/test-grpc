// apps/notification-management-service/__tests__/unit/handlers/getAdminNotifications.test.ts
import { status } from '@grpc/grpc-js';
import { getAdminNotifications } from '../../../src/handlers/getAdminNotifications';
import { getAdminNotificationsWithPagination } from '../../../src/services/model.service';

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
        ADMIN_NOTIFICATION: {
            FETCHED: 'Admin notifications fetched successfully',
        },
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

const { utilFns } = require('@atc/common');

describe('getAdminNotifications Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        mockCall = {
            request: {
                page: '1',
                limit: '10',
                status: 'SCHEDULED',
            },
        };
    });

    it('should fetch admin notifications successfully', async () => {
        const mockNotifications = [
            {
                id: 'notification-1',
                title: 'Test Notification 1',
                description: 'Description 1',
                scheduled_at: new Date(),
                channels: ['EMAIL'],
                target_users: {},
                status: 'SCHEDULED',
                createdAt: new Date(),
                updatedAt: new Date(),
                sent_count: 100,
                user_count: 150,
            },
        ];

        const mockResult = {
            adminNotifications: mockNotifications,
            total: 1,
        };

        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getAdminNotificationsWithPagination as jest.Mock).mockResolvedValue(
            mockResult,
        );

        await getAdminNotifications(mockCall, mockCallback);

        expect(getAdminNotificationsWithPagination).toHaveBeenCalledWith({
            page: 1,
            limit: 10,
            status: 'SCHEDULED',
        });

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Admin notifications fetched successfully',
            status: status.OK,
            data: {
                admin_notifications: mockNotifications,
                total: 1,
                page: 1,
                limit: 10,
            },
        });
    });

    it('should handle errors gracefully', async () => {
        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getAdminNotificationsWithPagination as jest.Mock).mockRejectedValue(
            new Error('Database error'),
        );

        await getAdminNotifications(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Something went wrong',
            status: status.INTERNAL,
            data: null,
        });
    });
});
