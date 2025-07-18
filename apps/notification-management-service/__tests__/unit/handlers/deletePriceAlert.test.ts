import { deletePriceAlert } from '../../../src/handlers/deletePriceAlert';
import {
    getPriceAlertByProductID,
    deletePriceAlertByID,
} from '../../../src/services/model.service';
import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { status } from '@grpc/grpc-js';
import { logger } from '@atc/logger';

// Mocks
jest.mock('../../../src/services/model.service');
jest.mock('@atc/logger');

const mockGetPriceAlertByProductID = getPriceAlertByProductID as jest.Mock;
const mockDeletePriceAlertByID = deletePriceAlertByID as jest.Mock;

describe('deletePriceAlert', () => {
    const callback = jest.fn();

    const mockCall: any = {
        request: { product_id: 'prod123' },
        user: { userID: 'user123' },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete price alert successfully', async () => {
        mockGetPriceAlertByProductID.mockResolvedValue({
            id: 'alert123',
            user_id: 'user123',
        });
        mockDeletePriceAlertByID.mockResolvedValue({});

        await deletePriceAlert(mockCall, callback);

        expect(mockGetPriceAlertByProductID).toHaveBeenCalledWith(
            'prod123',
            'user123',
        );
        expect(mockDeletePriceAlertByID).toHaveBeenCalledWith('alert123');
        expect(callback).toHaveBeenCalledWith(null, {
            message: responseMessage.PRICE_ALERT.DELETED,
            status: status.OK,
        });
    });

    it('should return NOT_FOUND if no price alert exists', async () => {
        mockGetPriceAlertByProductID.mockResolvedValue(null);

        await deletePriceAlert(mockCall, callback);

        expect(callback).toHaveBeenCalledWith(null, {
            message: errorMessage.PRICE_ALERT.NOT_FOUND,
            status: status.NOT_FOUND,
        });
    });

    it('should return UNAUTHENTICATED if user is not the owner', async () => {
        mockGetPriceAlertByProductID.mockResolvedValue({
            id: 'alert123',
            user_id: 'otherUser',
        });

        await deletePriceAlert(mockCall, callback);

        expect(callback).toHaveBeenCalledWith(null, {
            message: errorMessage.USER.UNAUTHORIZED_ACCESS,
            status: status.UNAUTHENTICATED,
        });
    });

    it('should return INTERNAL error on exception', async () => {
        const error = new Error('Database error');
        mockGetPriceAlertByProductID.mockRejectedValue(error);

        await deletePriceAlert(mockCall, callback);

        expect(logger.error).toHaveBeenCalledWith(error);
        expect(callback).toHaveBeenCalledWith(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    });
});
