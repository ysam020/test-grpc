// apps/notification-management-service/__tests__/unit/handlers/getSingleAdminNotification.test.ts
import { status } from '@grpc/grpc-js';
import { getSingleAdminNotification } from '../../../src/handlers/getSingleAdminNotification';
import { getAdminNotificationByID } from '../../../src/services/model.service';

jest.mock('../../../src/services/model.service');
jest.mock('@atc/common', () => ({
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
    errorMessage: {
        ADMIN_NOTIFICATION: {
            NOT_FOUND: 'Admin notification not found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        ADMIN_NOTIFICATION: {
            FETCHED: 'Admin notification fetched successfully',
        },
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

const { utilFns } = require('@atc/common');

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

    it('should fetch single admin notification successfully', async () => {
        const mockNotification = {
            id: 'test-id',
            title: 'Test Notification',
            description: 'Test Description',
            scheduled_at: new Date(),
            channels: ['EMAIL'],
            target_users: {},
            status: 'SCHEDULED',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getAdminNotificationByID as jest.Mock).mockResolvedValue(
            mockNotification,
        );

        await getSingleAdminNotification(mockCall, mockCallback);

        expect(getAdminNotificationByID).toHaveBeenCalledWith('test-id');
        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Admin notification fetched successfully',
            status: status.OK,
            data: expect.objectContaining({
                admin_notification_id: 'test-id',
                title: 'Test Notification',
                description: 'Test Description',
            }),
        });
    });

    it('should return NOT_FOUND when notification does not exist', async () => {
        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getAdminNotificationByID as jest.Mock).mockResolvedValue(null);

        await getSingleAdminNotification(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Admin notification not found',
            status: status.NOT_FOUND,
            data: null,
        });
    });

    it('should handle errors gracefully', async () => {
        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getAdminNotificationByID as jest.Mock).mockRejectedValue(
            new Error('Database error'),
        );

        await getSingleAdminNotification(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Something went wrong',
            status: status.INTERNAL,
            data: null,
        });
    });
});
