import { getAverageNotificationCount } from '../../../src/handlers/getAverageNotificationCount';
import { avgNotificationCount } from '../../../src/services/model.service';
import { status } from '@grpc/grpc-js';

// Mock external dependencies
jest.mock('../../../src/services/model.service', () => ({
    avgNotificationCount: jest.fn(),
}));

jest.mock('@atc/logger', () => ({
    logger: { error: jest.fn() },
}));

jest.mock('@atc/common', () => ({
    responseMessage: {
        OTHER: {
            DATA_FOUND: 'Data found successfully',
        },
    },
    errorMessage: {
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
}));

describe('getAverageNotificationCount', () => {
    const mockCallback = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return average notification count successfully', async () => {
        (avgNotificationCount as jest.Mock).mockResolvedValue(10.6);

        await getAverageNotificationCount({} as any, mockCallback);

        expect(avgNotificationCount).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Data found successfully',
            status: status.OK,
            data: { count: 11 },
        });
    });

    it('should handle errors and return default error response', async () => {
        (avgNotificationCount as jest.Mock).mockRejectedValue(
            new Error('DB error'),
        );

        await getAverageNotificationCount({} as any, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Something went wrong',
            status: status.INTERNAL,
            data: null,
        });
    });
});
