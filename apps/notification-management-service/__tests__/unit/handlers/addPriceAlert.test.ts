// apps/notification-management-service/__tests__/unit/handlers/addPriceAlert.test.ts
import { status } from '@grpc/grpc-js';
import { addPriceAlert } from '../../../src/handlers/addPriceAlert';
import {
    getProductByID,
    upsertPriceAlert,
} from '../../../src/services/model.service';

jest.mock('../../../src/services/model.service');
jest.mock('@atc/common', () => ({
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
    errorMessage: {
        PRODUCT: {
            NOT_FOUND: 'Product not found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        PRICE_ALERT: {
            ADDED: 'Price alert added successfully',
        },
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

const { utilFns } = require('@atc/common');

describe('addPriceAlert Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        mockCall = {
            request: {
                product_id: 'product-123',
                target_price: 100.0,
            },
            metadata: {
                get: jest.fn().mockReturnValue(['user-123']),
            },
        };
    });

    it('should add price alert successfully', async () => {
        const mockProduct = { id: 'product-123', name: 'Test Product' };

        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getProductByID as jest.Mock).mockResolvedValue(mockProduct);
        (upsertPriceAlert as jest.Mock).mockResolvedValue(true);

        await addPriceAlert(mockCall, mockCallback);

        expect(getProductByID).toHaveBeenCalledWith('product-123');
        expect(upsertPriceAlert).toHaveBeenCalledWith({
            target_price: 100.0,
            User: { connect: { id: 'user-123' } },
            MasterProduct: { connect: { id: 'product-123' } },
        });

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Price alert added successfully',
            status: status.OK,
        });
    });

    it('should return NOT_FOUND when product does not exist', async () => {
        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getProductByID as jest.Mock).mockResolvedValue(null);

        await addPriceAlert(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Product not found',
            status: status.NOT_FOUND,
        });
        expect(upsertPriceAlert).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getProductByID as jest.Mock).mockRejectedValue(
            new Error('Database error'),
        );

        await addPriceAlert(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Something went wrong',
            status: status.INTERNAL,
        });
    });
});
