// apps/notification-management-service/__tests__/unit/handlers/getPriceAlerts.test.ts
import { status } from '@grpc/grpc-js';
import { getPriceAlerts } from '../../../src/handlers/getPriceAlerts';
import { getPriceAlertsWithPagination } from '../../../src/services/model.service';

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
        PRICE_ALERT: {
            FETCHED: 'Price alerts fetched successfully',
        },
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

const { utilFns } = require('@atc/common');

describe('getPriceAlerts Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        mockCall = {
            request: {
                page: '1',
                limit: '10',
            },
            metadata: {
                get: jest.fn().mockReturnValue(['user-123']),
            },
        };
    });

    it('should fetch price alerts successfully', async () => {
        const mockPriceAlerts = [
            {
                id: 'alert-1',
                target_price: 100.0,
                User: { id: 'user-123', email: 'test@example.com' },
                MasterProduct: { id: 'product-1', name: 'Test Product' },
                createdAt: new Date(),
            },
        ];

        const mockResult = {
            priceAlerts: mockPriceAlerts,
            total: 1,
        };

        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getPriceAlertsWithPagination as jest.Mock).mockResolvedValue(
            mockResult,
        );

        await getPriceAlerts(mockCall, mockCallback);

        expect(getPriceAlertsWithPagination).toHaveBeenCalledWith({
            page: 1,
            limit: 10,
            user_id: 'user-123',
        });

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Price alerts fetched successfully',
            status: status.OK,
            data: {
                price_alerts: mockPriceAlerts,
                total: 1,
                page: 1,
                limit: 10,
            },
        });
    });

    it('should handle errors gracefully', async () => {
        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getPriceAlertsWithPagination as jest.Mock).mockRejectedValue(
            new Error('Database error'),
        );

        await getPriceAlerts(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Something went wrong',
            status: status.INTERNAL,
        });
    });
});
