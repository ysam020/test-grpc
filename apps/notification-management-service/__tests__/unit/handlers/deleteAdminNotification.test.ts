// apps/notification-management-service/__tests__/unit/handlers/deleteAdminNotification.test.ts
import { status } from '@grpc/grpc-js';
import { deleteAdminNotification } from '../../../src/handlers/deleteAdminNotification';
import {
    getAdminNotificationByID,
    deleteAdminNotificationByID,
} from '../../../src/services/model.service';

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
            DELETED: 'Admin notification deleted successfully',
        },
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

const { utilFns } = require('@atc/common');

describe('deleteAdminNotification Handler', () => {
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

    it('should delete admin notification successfully', async () => {
        const mockNotification = { id: 'test-id', title: 'Test' };

        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getAdminNotificationByID as jest.Mock).mockResolvedValue(
            mockNotification,
        );
        (deleteAdminNotificationByID as jest.Mock).mockResolvedValue(true);

        await deleteAdminNotification(mockCall, mockCallback);

        expect(getAdminNotificationByID).toHaveBeenCalledWith('test-id');
        expect(deleteAdminNotificationByID).toHaveBeenCalledWith('test-id');
        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Admin notification deleted successfully',
            status: status.OK,
        });
    });

    it('should return NOT_FOUND when notification does not exist', async () => {
        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getAdminNotificationByID as jest.Mock).mockResolvedValue(null);

        await deleteAdminNotification(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Admin notification not found',
            status: status.NOT_FOUND,
        });
        expect(deleteAdminNotificationByID).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getAdminNotificationByID as jest.Mock).mockRejectedValue(
            new Error('Database error'),
        );

        await deleteAdminNotification(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Something went wrong',
            status: status.INTERNAL,
        });
    });
});
