// apps/notification-management-service/__tests__/unit/handlers/getAverageNotificationCount.test.ts
import { status } from '@grpc/grpc-js';
import { getAverageNotificationCount } from '../../../src/handlers/getAverageNotificationCount';
import { getAverageNotificationCountFromDB } from '../../../src/services/model.service';

jest.mock('../../../src/services/model.service');
jest.mock('@atc/common', () => ({
    errorMessage: {
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        ADMIN_NOTIFICATION: {
            AVERAGE_COUNT_FETCHED:
                'Average notification count fetched successfully',
        },
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

describe('getAverageNotificationCount Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        mockCall = {
            request: {},
        };
    });

    it('should fetch average notification count successfully', async () => {
        const mockCount = 150;

        (getAverageNotificationCountFromDB as jest.Mock).mockResolvedValue(
            mockCount,
        );

        await getAverageNotificationCount(mockCall, mockCallback);

        expect(getAverageNotificationCountFromDB).toHaveBeenCalled();
        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Average notification count fetched successfully',
            status: status.OK,
            data: {
                count: mockCount,
            },
        });
    });

    it('should handle errors gracefully', async () => {
        (getAverageNotificationCountFromDB as jest.Mock).mockRejectedValue(
            new Error('Database error'),
        );

        await getAverageNotificationCount(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Something went wrong',
            status: status.INTERNAL,
            data: null,
        });
    });
});
