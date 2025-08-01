import { createNotification } from '../../../src/handlers/createNotification';
import { addNewNotification } from '../../../src/services/model.service';
import { status } from '@grpc/grpc-js';
import { logger } from '@atc/logger';
import { errorMessage, responseMessage, utilFns } from '@atc/common';

// Mock dependencies
jest.mock('../../../src/services/model.service');
jest.mock('@atc/logger');

const mockAddNewNotification = addNewNotification as jest.Mock;

describe('createNotification', () => {
    const callback = jest.fn();
    const mockCall: any = {
        request: {
            title: 'Test Title',
            description: 'Test Description',
            user_id: 'user-123',
            type: 'SYSTEM',
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new notification successfully', async () => {
        mockAddNewNotification.mockResolvedValue({});

        await createNotification(mockCall, callback);

        expect(mockAddNewNotification).toHaveBeenCalledWith({
            title: 'Test Title',
            description: 'Test Description',
            User: { connect: { id: 'user-123' } },
            type: 'SYSTEM',
        });

        expect(callback).toHaveBeenCalledWith(null, {
            message: responseMessage.NOTIFICATION.CREATED,
            status: status.OK,
        });
    });

    it('should return INTERNAL error on exception', async () => {
        const error = new Error('DB insert error');
        mockAddNewNotification.mockRejectedValue(error);

        await createNotification(mockCall, callback);

        expect(logger.error).toHaveBeenCalledWith(error);
        expect(callback).toHaveBeenCalledWith(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    });
});
