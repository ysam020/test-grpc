// Mock dependencies
jest.mock('@atc/common', () => ({
    errorMessage: {
        PRODUCT: {
            NOT_FOUND: 'Product not found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        BASKET: {
            ADD_TO_BASKET_SUCCESS: 'Product added to basket successfully',
        },
    },
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));

jest.mock('../../../src/services/model.service', () => ({
    createBasket: jest.fn(),
    getBasketByUserID: jest.fn(),
    getProductByID: jest.fn(),
    upsertBasketItem: jest.fn(),
}));

import { addToBasket } from '../../../src/handlers/addToBasket';
import { utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { status } from '@grpc/grpc-js';
import {
    createBasket,
    getBasketByUserID,
    getProductByID,
    upsertBasketItem,
} from '../../../src/services/model.service';

describe('Add To Basket Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
    });

    const mockCall = {
        request: {
            product_id: 'product-123',
            quantity: 2,
        },
        user: {
            userID: 'user-123',
        },
    };

    const mockProduct = {
        id: 'product-123',
        name: 'Test Product',
        price: 10.99,
        description: 'Test product description',
    };

    const mockExistingBasket = {
        id: 'basket-123',
        user_id: 'user-123',
        created_at: new Date(),
        updated_at: new Date(),
    };

    const mockNewBasket = {
        id: 'basket-456',
        user_id: 'user-123',
        created_at: new Date(),
        updated_at: new Date(),
    };

    const mockBasketItem = {
        id: 'basket-item-123',
        master_product_id: 'product-123',
        basket_id: 'basket-123',
        quantity: 2,
    };

    describe('successful add to basket scenarios', () => {
        it('should add product to existing basket successfully', async () => {
            // Mock successful dependencies
            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                quantity: 2,
            });
            (getProductByID as jest.Mock).mockResolvedValue(mockProduct);
            (getBasketByUserID as jest.Mock).mockResolvedValue(mockExistingBasket);
            (upsertBasketItem as jest.Mock).mockResolvedValue(mockBasketItem);

            await addToBasket(mockCall as any, mockCallback);

            // Verify utilFns.removeEmptyFields was called
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);

            // Verify product lookup
            expect(getProductByID).toHaveBeenCalledWith('product-123');

            // Verify basket lookup
            expect(getBasketByUserID).toHaveBeenCalledWith('user-123');

            // Verify basket creation was NOT called since basket exists
            expect(createBasket).not.toHaveBeenCalled();

            // Verify basket item upsert
            expect(upsertBasketItem).toHaveBeenCalledWith({
                master_product: { connect: { id: 'product-123' } },
                basket: { connect: { id: 'basket-123' } },
                quantity: 2,
            });

            // Verify successful response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Product added to basket successfully',
                    data: {
                        id: 'basket-123',
                        user_id: 'user-123',
                        master_product_id: 'product-123',
                        quantity: 2,
                    },
                    status: status.OK,
                })
            );
        });

        it('should create new basket and add product when user has no basket', async () => {
            // Mock successful dependencies with no existing basket
            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                quantity: 3,
            });
            (getProductByID as jest.Mock).mockResolvedValue(mockProduct);
            (getBasketByUserID as jest.Mock).mockResolvedValue(null); // No existing basket
            (createBasket as jest.Mock).mockResolvedValue(mockNewBasket);
            (upsertBasketItem as jest.Mock).mockResolvedValue({
                ...mockBasketItem,
                basket_id: 'basket-456',
                quantity: 3,
            });

            await addToBasket(mockCall as any, mockCallback);

            // Verify basket creation was called
            expect(createBasket).toHaveBeenCalledWith({
                user: { connect: { id: 'user-123' } },
            });

            // Verify basket item upsert with new basket
            expect(upsertBasketItem).toHaveBeenCalledWith({
                master_product: { connect: { id: 'product-123' } },
                basket: { connect: { id: 'basket-456' } },
                quantity: 3,
            });

            // Verify successful response with new basket data
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Product added to basket successfully',
                    data: {
                        id: 'basket-456',
                        user_id: 'user-123',
                        master_product_id: 'product-123',
                        quantity: 3,
                    },
                    status: status.OK,
                })
            );
        });

        it('should handle quantity of 1', async () => {
            const mockCallWithQuantity1 = {
                ...mockCall,
                request: {
                    product_id: 'product-123',
                    quantity: 1,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                quantity: 1,
            });
            (getProductByID as jest.Mock).mockResolvedValue(mockProduct);
            (getBasketByUserID as jest.Mock).mockResolvedValue(mockExistingBasket);
            (upsertBasketItem as jest.Mock).mockResolvedValue({
                ...mockBasketItem,
                quantity: 1,
            });

            await addToBasket(mockCallWithQuantity1 as any, mockCallback);

            expect(upsertBasketItem).toHaveBeenCalledWith({
                master_product: { connect: { id: 'product-123' } },
                basket: { connect: { id: 'basket-123' } },
                quantity: 1,
            });
        });
    });

    describe('product not found scenario', () => {
        it('should return NOT_FOUND when product does not exist', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'non-existent-product',
                quantity: 2,
            });
            (getProductByID as jest.Mock).mockResolvedValue(null);

            await addToBasket(mockCall as any, mockCallback);

            // Verify product lookup
            expect(getProductByID).toHaveBeenCalledWith('non-existent-product');

            // Verify early return - no further service calls
            expect(getBasketByUserID).not.toHaveBeenCalled();
            expect(createBasket).not.toHaveBeenCalled();
            expect(upsertBasketItem).not.toHaveBeenCalled();

            // Verify NOT_FOUND response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Product not found',
                    data: null,
                    status: status.NOT_FOUND,
                })
            );
        });

        it('should return NOT_FOUND when product lookup returns undefined', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                quantity: 2,
            });
            (getProductByID as jest.Mock).mockResolvedValue(undefined);

            await addToBasket(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Product not found',
                    data: null,
                    status: status.NOT_FOUND,
                })
            );
        });
    });

    describe('error handling', () => {
        it('should handle getProductByID error', async () => {
            const productError = new Error('Database connection failed');
            
            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                quantity: 2,
            });
            (getProductByID as jest.Mock).mockRejectedValue(productError);

            await addToBasket(mockCall as any, mockCallback);

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(productError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    data: null,
                    status: status.INTERNAL,
                })
            );

            // Verify subsequent services were not called
            expect(getBasketByUserID).not.toHaveBeenCalled();
            expect(createBasket).not.toHaveBeenCalled();
            expect(upsertBasketItem).not.toHaveBeenCalled();
        });

        it('should handle getBasketByUserID error', async () => {
            const basketError = new Error('Failed to fetch user basket');
            
            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                quantity: 2,
            });
            (getProductByID as jest.Mock).mockResolvedValue(mockProduct);
            (getBasketByUserID as jest.Mock).mockRejectedValue(basketError);

            await addToBasket(mockCall as any, mockCallback);

            // Verify services were called up to the error point
            expect(getProductByID).toHaveBeenCalledWith('product-123');
            expect(getBasketByUserID).toHaveBeenCalledWith('user-123');

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(basketError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    data: null,
                    status: status.INTERNAL,
                })
            );

            // Verify subsequent services were not called
            expect(createBasket).not.toHaveBeenCalled();
            expect(upsertBasketItem).not.toHaveBeenCalled();
        });

        it('should handle createBasket error', async () => {
            const createBasketError = new Error('Failed to create basket');
            
            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                quantity: 2,
            });
            (getProductByID as jest.Mock).mockResolvedValue(mockProduct);
            (getBasketByUserID as jest.Mock).mockResolvedValue(null); // No existing basket
            (createBasket as jest.Mock).mockRejectedValue(createBasketError);

            await addToBasket(mockCall as any, mockCallback);

            // Verify services were called up to the error point
            expect(getProductByID).toHaveBeenCalledWith('product-123');
            expect(getBasketByUserID).toHaveBeenCalledWith('user-123');
            expect(createBasket).toHaveBeenCalledWith({
                user: { connect: { id: 'user-123' } },
            });

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(createBasketError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    data: null,
                    status: status.INTERNAL,
                })
            );

            // Verify upsertBasketItem was not called
            expect(upsertBasketItem).not.toHaveBeenCalled();
        });

        it('should handle upsertBasketItem error', async () => {
            const upsertError = new Error('Failed to upsert basket item');
            
            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                quantity: 2,
            });
            (getProductByID as jest.Mock).mockResolvedValue(mockProduct);
            (getBasketByUserID as jest.Mock).mockResolvedValue(mockExistingBasket);
            (upsertBasketItem as jest.Mock).mockRejectedValue(upsertError);

            await addToBasket(mockCall as any, mockCallback);

            // Verify all services were called up to the error point
            expect(getProductByID).toHaveBeenCalledWith('product-123');
            expect(getBasketByUserID).toHaveBeenCalledWith('user-123');
            expect(upsertBasketItem).toHaveBeenCalledWith({
                master_product: { connect: { id: 'product-123' } },
                basket: { connect: { id: 'basket-123' } },
                quantity: 2,
            });

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(upsertError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    data: null,
                    status: status.INTERNAL,
                })
            );
        });

        it('should handle utilFns.removeEmptyFields error', async () => {
            const removeEmptyFieldsError = new Error('Field validation failed');
            
            utilFns.removeEmptyFields.mockImplementation(() => {
                throw removeEmptyFieldsError;
            });

            await addToBasket(mockCall as any, mockCallback);

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(removeEmptyFieldsError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    data: null,
                    status: status.INTERNAL,
                })
            );

            // Verify no subsequent services were called
            expect(getProductByID).not.toHaveBeenCalled();
            expect(getBasketByUserID).not.toHaveBeenCalled();
            expect(createBasket).not.toHaveBeenCalled();
            expect(upsertBasketItem).not.toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('should handle missing userID in call.user', async () => {
            const mockCallWithoutUserID = {
                request: {
                    product_id: 'product-123',
                    quantity: 2,
                },
                user: {}, // Missing userID
            };

            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                quantity: 2,
            });
            (getProductByID as jest.Mock).mockResolvedValue(mockProduct);
            (getBasketByUserID as jest.Mock).mockResolvedValue(null);

            await addToBasket(mockCallWithoutUserID as any, mockCallback);

            // Should attempt to call getBasketByUserID with undefined userID
            expect(getBasketByUserID).toHaveBeenCalledWith(undefined);
            expect(createBasket).toHaveBeenCalledWith({
                user: { connect: { id: undefined } },
            });
        });

        it('should handle zero quantity', async () => {
            const mockCallWithZeroQuantity = {
                ...mockCall,
                request: {
                    product_id: 'product-123',
                    quantity: 0,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                quantity: 0,
            });
            (getProductByID as jest.Mock).mockResolvedValue(mockProduct);
            (getBasketByUserID as jest.Mock).mockResolvedValue(mockExistingBasket);
            (upsertBasketItem as jest.Mock).mockResolvedValue({
                ...mockBasketItem,
                quantity: 0,
            });

            await addToBasket(mockCallWithZeroQuantity as any, mockCallback);

            expect(upsertBasketItem).toHaveBeenCalledWith({
                master_product: { connect: { id: 'product-123' } },
                basket: { connect: { id: 'basket-123' } },
                quantity: 0,
            });
        });

        it('should handle missing product_id after removeEmptyFields', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                quantity: 2,
                // Missing product_id
            });

            await addToBasket(mockCall as any, mockCallback);

            // Should attempt to call getProductByID with undefined
            expect(getProductByID).toHaveBeenCalledWith(undefined);
        });

        it('should handle missing quantity after removeEmptyFields', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                // Missing quantity
            });
            (getProductByID as jest.Mock).mockResolvedValue(mockProduct);
            (getBasketByUserID as jest.Mock).mockResolvedValue(mockExistingBasket);
            (upsertBasketItem as jest.Mock).mockResolvedValue({
                ...mockBasketItem,
                quantity: undefined,
            });

            await addToBasket(mockCall as any, mockCallback);

            expect(upsertBasketItem).toHaveBeenCalledWith({
                master_product: { connect: { id: 'product-123' } },
                basket: { connect: { id: 'basket-123' } },
                quantity: undefined,
            });
        });
    });

    describe('function call order and dependencies', () => {
        it('should call functions in correct order for existing basket', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                quantity: 2,
            });
            (getProductByID as jest.Mock).mockResolvedValue(mockProduct);
            (getBasketByUserID as jest.Mock).mockResolvedValue(mockExistingBasket);
            (upsertBasketItem as jest.Mock).mockResolvedValue(mockBasketItem);

            await addToBasket(mockCall as any, mockCallback);

            // Verify call order
            const removeEmptyFieldsCall = utilFns.removeEmptyFields.mock.invocationCallOrder[0];
            const getProductCall = (getProductByID as jest.Mock).mock.invocationCallOrder[0];
            const getBasketCall = (getBasketByUserID as jest.Mock).mock.invocationCallOrder[0];
            const upsertCall = (upsertBasketItem as jest.Mock).mock.invocationCallOrder[0];
            const callbackCall = mockCallback.mock.invocationCallOrder[0];

            expect(removeEmptyFieldsCall).toBeLessThan(getProductCall);
            expect(getProductCall).toBeLessThan(getBasketCall);
            expect(getBasketCall).toBeLessThan(upsertCall);
            expect(upsertCall).toBeLessThan(callbackCall);
        });

        it('should call functions in correct order for new basket creation', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                quantity: 2,
            });
            (getProductByID as jest.Mock).mockResolvedValue(mockProduct);
            (getBasketByUserID as jest.Mock).mockResolvedValue(null);
            (createBasket as jest.Mock).mockResolvedValue(mockNewBasket);
            (upsertBasketItem as jest.Mock).mockResolvedValue(mockBasketItem);

            await addToBasket(mockCall as any, mockCallback);

            // Verify call order including basket creation
            const getProductCall = (getProductByID as jest.Mock).mock.invocationCallOrder[0];
            const getBasketCall = (getBasketByUserID as jest.Mock).mock.invocationCallOrder[0];
            const createBasketCall = (createBasket as jest.Mock).mock.invocationCallOrder[0];
            const upsertCall = (upsertBasketItem as jest.Mock).mock.invocationCallOrder[0];

            expect(getProductCall).toBeLessThan(getBasketCall);
            expect(getBasketCall).toBeLessThan(createBasketCall);
            expect(createBasketCall).toBeLessThan(upsertCall);
        });

        it('should not proceed if product is not found', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                quantity: 2,
            });
            (getProductByID as jest.Mock).mockResolvedValue(null);

            await addToBasket(mockCall as any, mockCallback);

            expect(getProductByID).toHaveBeenCalled();
            expect(getBasketByUserID).not.toHaveBeenCalled();
            expect(createBasket).not.toHaveBeenCalled();
            expect(upsertBasketItem).not.toHaveBeenCalled();
        });
    });

    describe('response data structure', () => {
        it('should return correct data structure on success', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                quantity: 2,
            });
            (getProductByID as jest.Mock).mockResolvedValue(mockProduct);
            (getBasketByUserID as jest.Mock).mockResolvedValue(mockExistingBasket);
            (upsertBasketItem as jest.Mock).mockResolvedValue(mockBasketItem);

            await addToBasket(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                {
                    message: 'Product added to basket successfully',
                    data: {
                        id: 'basket-123',
                        user_id: 'user-123',
                        master_product_id: 'product-123',
                        quantity: 2,
                    },
                    status: status.OK,
                }
            );
        });

        it('should return null data on error', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                quantity: 2,
            });
            (getProductByID as jest.Mock).mockRejectedValue(new Error('Test error'));

            await addToBasket(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                {
                    message: 'Something went wrong',
                    data: null,
                    status: status.INTERNAL,
                }
            );
        });

        it('should return null data for product not found', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                product_id: 'product-123',
                quantity: 2,
            });
            (getProductByID as jest.Mock).mockResolvedValue(null);

            await addToBasket(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                {
                    message: 'Product not found',
                    data: null,
                    status: status.NOT_FOUND,
                }
            );
        });
    });
});