import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    RemoveFromBasketRequest__Output,
    RemoveFromBasketResponse,
    RemoveFromBasketResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { removeFromBasket } from '../../../src/handlers/removeFromBasket';
import {
    deleteBasketByID,
    deleteBasketItemByID,
    getDetailedBasketByUserID,
} from '../../../src/services/model.service';

// Mock dependencies
jest.mock('@atc/common', () => ({
    errorMessage: {
        BASKET: {
            BASKET_NOT_FOUND: 'Basket not found',
            PRODUCT_NOT_FOUND: 'Product not found in basket',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        BASKET: {
            REMOVE_FROM_BASKET_SUCCESS: 'Product removed from basket successfully',
        },
    },
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

jest.mock('../../../src/services/model.service');

const mockGetDetailedBasketByUserID = getDetailedBasketByUserID as jest.Mock;
const mockDeleteBasketByID = deleteBasketByID as jest.Mock;
const mockDeleteBasketItemByID = deleteBasketItemByID as jest.Mock;
const mockUtilFns = utilFns as jest.Mocked<typeof utilFns>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('removeFromBasket Handler', () => {
    let mockCall: jest.Mocked<CustomServerUnaryCall<RemoveFromBasketRequest__Output, RemoveFromBasketResponse>>;
    let mockCallback: jest.MockedFunction<sendUnaryData<RemoveFromBasketResponse__Output>>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockCallback = jest.fn();
        
        // Default mock implementations
        mockUtilFns.removeEmptyFields.mockImplementation((obj) => obj);
    });

    const createMockCall = (request: any, userID: string = 'user-123') => ({
        request,
        user: { userID },
        metadata: {
            get: jest.fn(),
            set: jest.fn(),
            add: jest.fn(),
            remove: jest.fn(),
            clone: jest.fn(),
        },
        cancelled: false,
        deadline: new Date(Date.now() + 30000),
        peer: 'localhost:50053',
    });

    describe('Successful scenarios', () => {
        it('should remove product and delete entire basket when it contains only one item', async () => {
            // Arrange
            const mockRequest = { master_product_id: 'product-123' };
            const mockCall = createMockCall(mockRequest, 'user-123');
            
            const mockBasket = {
                id: 'basket-1',
                user_id: 'user-123',
                BasketItem: [
                    {
                        id: 'item-1',
                        master_product_id: 'product-123',
                        quantity: 2,
                    },
                ],
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ master_product_id: 'product-123' });
            mockGetDetailedBasketByUserID.mockResolvedValue(mockBasket);
            mockDeleteBasketByID.mockResolvedValue(undefined);

            // Act
            await removeFromBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockUtilFns.removeEmptyFields).toHaveBeenCalledWith(mockRequest);
            expect(mockGetDetailedBasketByUserID).toHaveBeenCalledWith('user-123');
            expect(mockDeleteBasketByID).toHaveBeenCalledWith('basket-1');
            expect(mockDeleteBasketItemByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.BASKET.REMOVE_FROM_BASKET_SUCCESS,
                status: status.OK,
            });
        });

        it('should remove specific product item when basket contains multiple items', async () => {
            // Arrange
            const mockRequest = { master_product_id: 'product-123' };
            const mockCall = createMockCall(mockRequest, 'user-456');
            
            const mockBasket = {
                id: 'basket-2',
                user_id: 'user-456',
                BasketItem: [
                    {
                        id: 'item-1',
                        master_product_id: 'product-123',
                        quantity: 1,
                    },
                    {
                        id: 'item-2',
                        master_product_id: 'product-456',
                        quantity: 3,
                    },
                    {
                        id: 'item-3',
                        master_product_id: 'product-789',
                        quantity: 2,
                    },
                ],
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ master_product_id: 'product-123' });
            mockGetDetailedBasketByUserID.mockResolvedValue(mockBasket);
            mockDeleteBasketItemByID.mockResolvedValue(undefined);

            // Act
            await removeFromBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockGetDetailedBasketByUserID).toHaveBeenCalledWith('user-456');
            expect(mockDeleteBasketItemByID).toHaveBeenCalledWith('item-1');
            expect(mockDeleteBasketByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.BASKET.REMOVE_FROM_BASKET_SUCCESS,
                status: status.OK,
            });
        });

        it('should handle removal of last remaining item correctly', async () => {
            // Arrange
            const mockRequest = { master_product_id: 'product-last' };
            const mockCall = createMockCall(mockRequest, 'user-789');
            
            const mockBasket = {
                id: 'basket-3',
                user_id: 'user-789',
                BasketItem: [
                    {
                        id: 'item-last',
                        master_product_id: 'product-last',
                        quantity: 1,
                    },
                ],
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ master_product_id: 'product-last' });
            mockGetDetailedBasketByUserID.mockResolvedValue(mockBasket);
            mockDeleteBasketByID.mockResolvedValue(undefined);

            // Act
            await removeFromBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockDeleteBasketByID).toHaveBeenCalledWith('basket-3');
            expect(mockDeleteBasketItemByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.BASKET.REMOVE_FROM_BASKET_SUCCESS,
                status: status.OK,
            });
        });
    });

    describe('Error scenarios', () => {
        it('should return NOT_FOUND when basket does not exist', async () => {
            // Arrange
            const mockRequest = { master_product_id: 'product-123' };
            const mockCall = createMockCall(mockRequest, 'user-nonexistent');

            mockUtilFns.removeEmptyFields.mockReturnValue({ master_product_id: 'product-123' });
            mockGetDetailedBasketByUserID.mockResolvedValue(null);

            // Act
            await removeFromBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockGetDetailedBasketByUserID).toHaveBeenCalledWith('user-nonexistent');
            expect(mockDeleteBasketByID).not.toHaveBeenCalled();
            expect(mockDeleteBasketItemByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.BASKET.BASKET_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        });

        it('should return NOT_FOUND when product is not in basket', async () => {
            // Arrange
            const mockRequest = { master_product_id: 'product-nonexistent' };
            const mockCall = createMockCall(mockRequest, 'user-123');
            
            const mockBasket = {
                id: 'basket-1',
                user_id: 'user-123',
                BasketItem: [
                    {
                        id: 'item-1',
                        master_product_id: 'product-123',
                        quantity: 1,
                    },
                    {
                        id: 'item-2',
                        master_product_id: 'product-456',
                        quantity: 2,
                    },
                ],
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ master_product_id: 'product-nonexistent' });
            mockGetDetailedBasketByUserID.mockResolvedValue(mockBasket);

            // Act
            await removeFromBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockGetDetailedBasketByUserID).toHaveBeenCalledWith('user-123');
            expect(mockDeleteBasketByID).not.toHaveBeenCalled();
            expect(mockDeleteBasketItemByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.BASKET.PRODUCT_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        });

        it('should handle database errors during basket retrieval', async () => {
            // Arrange
            const mockRequest = { master_product_id: 'product-123' };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockError = new Error('Database connection failed');

            mockUtilFns.removeEmptyFields.mockReturnValue({ master_product_id: 'product-123' });
            mockGetDetailedBasketByUserID.mockRejectedValue(mockError);

            // Act
            await removeFromBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
            });
        });

        it('should handle errors during basket deletion', async () => {
            // Arrange
            const mockRequest = { master_product_id: 'product-123' };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockError = new Error('Failed to delete basket');
            
            const mockBasket = {
                id: 'basket-1',
                user_id: 'user-123',
                BasketItem: [
                    {
                        id: 'item-1',
                        master_product_id: 'product-123',
                        quantity: 1,
                    },
                ],
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ master_product_id: 'product-123' });
            mockGetDetailedBasketByUserID.mockResolvedValue(mockBasket);
            mockDeleteBasketByID.mockRejectedValue(mockError);

            // Act
            await removeFromBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
            });
        });

        it('should handle errors during basket item deletion', async () => {
            // Arrange
            const mockRequest = { master_product_id: 'product-123' };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockError = new Error('Failed to delete basket item');
            
            const mockBasket = {
                id: 'basket-1',
                user_id: 'user-123',
                BasketItem: [
                    {
                        id: 'item-1',
                        master_product_id: 'product-123',
                        quantity: 1,
                    },
                    {
                        id: 'item-2',
                        master_product_id: 'product-456',
                        quantity: 2,
                    },
                ],
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ master_product_id: 'product-123' });
            mockGetDetailedBasketByUserID.mockResolvedValue(mockBasket);
            mockDeleteBasketItemByID.mockRejectedValue(mockError);

            // Act
            await removeFromBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
            });
        });

        it('should handle utilFns.removeEmptyFields throwing an error', async () => {
            // Arrange
            const mockRequest = { master_product_id: 'product-123' };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockError = new Error('removeEmptyFields failed');

            mockUtilFns.removeEmptyFields.mockImplementation(() => {
                throw mockError;
            });

            // Act
            await removeFromBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
            });
        });
    });

    describe('Edge cases', () => {
        it('should handle empty basket items array', async () => {
            // Arrange
            const mockRequest = { master_product_id: 'product-123' };
            const mockCall = createMockCall(mockRequest, 'user-123');
            
            const mockBasket = {
                id: 'basket-1',
                user_id: 'user-123',
                BasketItem: [], // Empty array
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ master_product_id: 'product-123' });
            mockGetDetailedBasketByUserID.mockResolvedValue(mockBasket);

            // Act
            await removeFromBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.BASKET.PRODUCT_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        });

        it('should handle basket with null BasketItem', async () => {
            // Arrange
            const mockRequest = { master_product_id: 'product-123' };
            const mockCall = createMockCall(mockRequest, 'user-123');
            
            const mockBasket = {
                id: 'basket-1',
                user_id: 'user-123',
                BasketItem: null, // Null array
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ master_product_id: 'product-123' });
            mockGetDetailedBasketByUserID.mockResolvedValue(mockBasket);

            // Act
            await removeFromBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
            });
        });

        it('should handle missing userID in call.user', async () => {
            // Arrange
            const mockRequest = { master_product_id: 'product-123' };
            const mockCall = {
                request: mockRequest,
                user: {}, // Missing userID
                metadata: {
                    get: jest.fn(),
                    set: jest.fn(),
                    add: jest.fn(),
                    remove: jest.fn(),
                    clone: jest.fn(),
                },
                cancelled: false,
                deadline: new Date(Date.now() + 30000),
                peer: 'localhost:50053',
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ master_product_id: 'product-123' });
            // When userID is undefined, getDetailedBasketByUserID will likely return null
            mockGetDetailedBasketByUserID.mockResolvedValue(null);

            // Act
            await removeFromBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockGetDetailedBasketByUserID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.BASKET.BASKET_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        });

        it('should handle master_product_id with special characters', async () => {
            // Arrange
            const specialProductId = 'product-123-@#$%^&*()';
            const mockRequest = { master_product_id: specialProductId };
            const mockCall = createMockCall(mockRequest, 'user-123');
            
            const mockBasket = {
                id: 'basket-1',
                user_id: 'user-123',
                BasketItem: [
                    {
                        id: 'item-1',
                        master_product_id: specialProductId,
                        quantity: 1,
                    },
                ],
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ master_product_id: specialProductId });
            mockGetDetailedBasketByUserID.mockResolvedValue(mockBasket);
            mockDeleteBasketByID.mockResolvedValue(undefined);

            // Act
            await removeFromBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockDeleteBasketByID).toHaveBeenCalledWith('basket-1');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.BASKET.REMOVE_FROM_BASKET_SUCCESS,
                status: status.OK,
            });
        });
    });

    describe('Business logic validation', () => {
        it('should correctly identify when to delete entire basket vs single item', async () => {
            // Test the exact boundary condition: 1 item = delete basket, 2+ items = delete item only
            
            // Case 1: Exactly 1 item - should delete entire basket
            const mockRequest1 = { master_product_id: 'product-123' };
            const mockCall1 = createMockCall(mockRequest1, 'user-123');
            
            const singleItemBasket = {
                id: 'basket-single',
                user_id: 'user-123',
                BasketItem: [
                    { id: 'item-1', master_product_id: 'product-123', quantity: 1 },
                ],
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ master_product_id: 'product-123' });
            mockGetDetailedBasketByUserID.mockResolvedValue(singleItemBasket);
            mockDeleteBasketByID.mockResolvedValue(undefined);

            await removeFromBasket(mockCall1 as any, mockCallback);

            expect(mockDeleteBasketByID).toHaveBeenCalledWith('basket-single');
            expect(mockDeleteBasketItemByID).not.toHaveBeenCalled();

            // Reset mocks for second test
            jest.clearAllMocks();
            mockUtilFns.removeEmptyFields.mockImplementation((obj) => obj);

            // Case 2: Exactly 2 items - should delete only the item
            const mockRequest2 = { master_product_id: 'product-123' };
            const mockCall2 = createMockCall(mockRequest2, 'user-123');
            
            const twoItemBasket = {
                id: 'basket-two',
                user_id: 'user-123',
                BasketItem: [
                    { id: 'item-1', master_product_id: 'product-123', quantity: 1 },
                    { id: 'item-2', master_product_id: 'product-456', quantity: 1 },
                ],
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ master_product_id: 'product-123' });
            mockGetDetailedBasketByUserID.mockResolvedValue(twoItemBasket);
            mockDeleteBasketItemByID.mockResolvedValue(undefined);

            await removeFromBasket(mockCall2 as any, mockCallback);

            expect(mockDeleteBasketItemByID).toHaveBeenCalledWith('item-1');
            expect(mockDeleteBasketByID).not.toHaveBeenCalled();
        });
    });
});