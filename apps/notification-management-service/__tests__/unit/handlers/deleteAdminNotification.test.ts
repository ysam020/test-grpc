import { deleteAdminNotification } from '../../../src/handlers/deleteAdminNotification';
import {
    getAdminNotificationByID,
    deleteAdminNotificationByID,
} from '../../../src/services/model.service';
import { status } from '@grpc/grpc-js';
import { logger } from '@atc/logger';
import { errorMessage, responseMessage, utilFns } from '@atc/common';

// Mock dependencies
jest.mock('../../../src/services/model.service');
jest.mock('@atc/logger');

const mockGetAdminNotificationByID = getAdminNotificationByID as jest.Mock;
const mockDeleteAdminNotificationByID =
    deleteAdminNotificationByID as jest.Mock;

describe('deleteAdminNotification', () => {
    const callback = jest.fn();
    const mockCall: any = {
        request: {
            admin_notification_id: 'admin-notif-123',
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete admin notification successfully', async () => {
        mockGetAdminNotificationByID.mockResolvedValue({
            id: 'admin-notif-123',
        });
        mockDeleteAdminNotificationByID.mockResolvedValue({});

        await deleteAdminNotification(mockCall, callback);

        expect(mockGetAdminNotificationByID).toHaveBeenCalledWith(
            'admin-notif-123',
        );
        expect(mockDeleteAdminNotificationByID).toHaveBeenCalledWith(
            'admin-notif-123',
        );
        expect(callback).toHaveBeenCalledWith(null, {
            message: responseMessage.ADMIN_NOTIFICATION.DELETED,
            status: status.OK,
        });
    });

    it('should return NOT_FOUND if admin notification does not exist', async () => {
        mockGetAdminNotificationByID.mockResolvedValue(null);

        await deleteAdminNotification(mockCall, callback);

        expect(callback).toHaveBeenCalledWith(null, {
            message: errorMessage.ADMIN_NOTIFICATION.NOT_FOUND,
            status: status.NOT_FOUND,
        });
    });

    it('should return INTERNAL error on exception', async () => {
        const error = new Error('DB failure');
        mockGetAdminNotificationByID.mockRejectedValue(error);

        await deleteAdminNotification(mockCall, callback);

        expect(logger.error).toHaveBeenCalledWith(error);
        expect(callback).toHaveBeenCalledWith(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    });
});
