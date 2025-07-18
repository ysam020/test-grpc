// apps/notification-management-service/__tests__/unit/handlers/deletePriceAlert.test.ts
import { status } from '@grpc/grpc-js';
import { deletePriceAlert } from '../../../src/handlers/deletePriceAlert';
import {
    getPriceAlertByProductID,
    deletePriceAlertByID,
} from '../../../src/services/model.service';

jest.mock('../../../src/services/model.service');
jest.mock('@atc/common', () => ({
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
    errorMessage: {
        PRICE_ALERT: {
            NOT_FOUND: 'Price alert not found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        PRICE_ALERT: {
            DELETED: 'Price alert deleted successfully',
        },
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

const { utilFns } = require('@atc/common');

describe('deletePriceAlert Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        mockCall = {
            request: {
                product_id: 'product-123',
            },
            metadata: {
                get: jest.fn().mockReturnValue(['user-123']),
            },
        };
    });

    it('should delete price alert successfully', async () => {
        const mockPriceAlert = {
            id: 'alert-1',
            product_id: 'product-123',
            user_id: 'user-123',
        };

        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getPriceAlertByProductID as jest.Mock).mockResolvedValue(
            mockPriceAlert,
        );
        (deletePriceAlertByID as jest.Mock).mockResolvedValue(true);

        await deletePriceAlert(mockCall, mockCallback);

        expect(getPriceAlertByProductID).toHaveBeenCalledWith(
            'product-123',
            'user-123',
        );
        expect(deletePriceAlertByID).toHaveBeenCalledWith('alert-1');

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Price alert deleted successfully',
            status: status.OK,
        });
    });

    it('should return NOT_FOUND when price alert does not exist', async () => {
        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getPriceAlertByProductID as jest.Mock).mockResolvedValue(null);

        await deletePriceAlert(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Price alert not found',
            status: status.NOT_FOUND,
        });
        expect(deletePriceAlertByID).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getPriceAlertByProductID as jest.Mock).mockRejectedValue(
            new Error('Database error'),
        );

        await deletePriceAlert(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Something went wrong',
            status: status.INTERNAL,
        });
    });
});
