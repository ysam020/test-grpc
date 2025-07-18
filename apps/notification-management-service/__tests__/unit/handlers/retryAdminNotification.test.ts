// apps/notification-management-service/__tests__/unit/handlers/retryAdminNotification.test.ts
import { status } from '@grpc/grpc-js';
import { retryAdminNotification } from '../../../src/handlers/retryAdminNotification';
import {
    getFailedNotifications,
    markNotificationsAsSent,
} from '../../../src/services/model.service';

jest.mock('../../../src/services/model.service');
jest.mock('@atc/common', () => ({
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
    errorMessage: {
        ADMIN_NOTIFICATION: {
            NO_FAILED_NOTIFICATIONS: 'No failed notifications found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        ADMIN_NOTIFICATION: {
            RETRY_SUCCESS: 'Notifications retried successfully',
        },
    },
    snsHelper: {
        createTopic: jest.fn(),
    },
    sendEmail: jest.fn(),
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

const { utilFns, snsHelper } = require('@atc/common');

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
        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getFailedNotifications as jest.Mock).mockResolvedValue([]);

        await retryAdminNotification(mockCall, mockCallback);

        expect(getFailedNotifications).toHaveBeenCalledWith('notification-123');
        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'No failed notifications found',
            status: status.NOT_FOUND,
        });
    });

    it('should handle errors gracefully', async () => {
        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getFailedNotifications as jest.Mock).mockRejectedValue(
            new Error('Database error'),
        );

        await retryAdminNotification(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Something went wrong',
            status: status.INTERNAL,
        });
    });
});
