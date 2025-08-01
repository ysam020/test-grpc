// Mock dependencies
jest.mock('@atc/common', () => ({
    errorMessage: {
        BASKET: {
            BASKET_NOT_FOUND: 'Basket not found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        BASKET: {
            CLEAR_BASKET_SUCCESS: 'Basket cleared successfully',
        },
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
    deleteBasketByID: jest.fn(),
    getBasketByUserID: jest.fn(),
}));

import { clearBasket } from '../../../src/handlers/clearBasket';
import { logger } from '@atc/logger';
import { status } from '@grpc/grpc-js';
import {
    deleteBasketByID,
    getBasketByUserID,
} from '../../../src/services/model.service';

describe('Clear Basket Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
    });

    const mockCall = {
        request: {}, // ClearBasketRequest has no body parameters
        user: {
            userID: 'user-123',
        },
    };

    const mockBasket = {
        id: 'basket-123',
        user_id: 'user-123',
        created_at: new Date(),
        updated_at: new Date(),
    };

    describe('successful basket clearing', () => {
        it('should clear basket successfully when basket exists', async () => {
            // Mock successful dependencies
            (getBasketByUserID as jest.Mock).mockResolvedValue(mockBasket);
            (deleteBasketByID as jest.Mock).mockResolvedValue(undefined);

            await clearBasket(mockCall as any, mockCallback);

            // Verify basket lookup
            expect(getBasketByUserID).toHaveBeenCalledWith('user-123');

            // Verify basket deletion
            expect(deleteBasketByID).toHaveBeenCalledWith('basket-123');

            // Verify successful response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Basket cleared successfully',
                    status: status.OK,
                })
            );
        });

        it('should handle different user IDs correctly', async () => {
            const mockCallDifferentUser = {
                request: {},
                user: {
                    userID: 'user-456',
                },
            };

            const mockBasketDifferentUser = {
                ...mockBasket,
                id: 'basket-456',
                user_id: 'user-456',
            };

            (getBasketByUserID as jest.Mock).mockResolvedValue(mockBasketDifferentUser);
            (deleteBasketByID as jest.Mock).mockResolvedValue(undefined);

            await clearBasket(mockCallDifferentUser as any, mockCallback);

            expect(getBasketByUserID).toHaveBeenCalledWith('user-456');
            expect(deleteBasketByID).toHaveBeenCalledWith('basket-456');
        });

        it('should handle basket with different properties', async () => {
            const mockBasketWithExtraProps = {
                id: 'basket-789',
                user_id: 'user-123',
                total_amount: 99.99,
                item_count: 5,
                created_at: new Date(),
                updated_at: new Date(),
                extra_field: 'some-value',
            };

            (getBasketByUserID as jest.Mock).mockResolvedValue(mockBasketWithExtraProps);
            (deleteBasketByID as jest.Mock).mockResolvedValue(undefined);

            await clearBasket(mockCall as any, mockCallback);

            expect(deleteBasketByID).toHaveBeenCalledWith('basket-789');
        });
    });

    describe('basket not found scenario', () => {
        it('should return NOT_FOUND when user has no basket', async () => {
            (getBasketByUserID as jest.Mock).mockResolvedValue(null);

            await clearBasket(mockCall as any, mockCallback);

            // Verify basket lookup
            expect(getBasketByUserID).toHaveBeenCalledWith('user-123');

            // Verify early return - no deletion attempted
            expect(deleteBasketByID).not.toHaveBeenCalled();

            // Verify NOT_FOUND response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Basket not found',
                    status: status.NOT_FOUND,
                })
            );
        });

        it('should return NOT_FOUND when basket lookup returns undefined', async () => {
            (getBasketByUserID as jest.Mock).mockResolvedValue(undefined);

            await clearBasket(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Basket not found',
                    status: status.NOT_FOUND,
                })
            );

            expect(deleteBasketByID).not.toHaveBeenCalled();
        });

        it('should return NOT_FOUND when basket lookup returns falsy value', async () => {
            (getBasketByUserID as jest.Mock).mockResolvedValue(false);

            await clearBasket(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Basket not found',
                    status: status.NOT_FOUND,
                })
            );
        });
    });

    describe('error handling', () => {
        it('should handle getBasketByUserID error', async () => {
            const getBasketError = new Error('Database connection failed');
            
            (getBasketByUserID as jest.Mock).mockRejectedValue(getBasketError);

            await clearBasket(mockCall as any, mockCallback);

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(getBasketError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                })
            );

            // Verify deleteBasketByID was not called due to early error
            expect(deleteBasketByID).not.toHaveBeenCalled();
        });

        it('should handle deleteBasketByID error', async () => {
            const deleteBasketError = new Error('Failed to delete basket');
            
            (getBasketByUserID as jest.Mock).mockResolvedValue(mockBasket);
            (deleteBasketByID as jest.Mock).mockRejectedValue(deleteBasketError);

            await clearBasket(mockCall as any, mockCallback);

            // Verify services were called up to the error point
            expect(getBasketByUserID).toHaveBeenCalledWith('user-123');
            expect(deleteBasketByID).toHaveBeenCalledWith('basket-123');

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(deleteBasketError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                })
            );
        });

        it('should handle unexpected error types', async () => {
            const unexpectedError = 'String error instead of Error object';
            
            (getBasketByUserID as jest.Mock).mockRejectedValue(unexpectedError);

            await clearBasket(mockCall as any, mockCallback);

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(unexpectedError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                })
            );
        });

        it('should handle network timeout errors', async () => {
            const timeoutError = new Error('ETIMEDOUT: Request timeout');
            
            (getBasketByUserID as jest.Mock).mockResolvedValue(mockBasket);
            (deleteBasketByID as jest.Mock).mockRejectedValue(timeoutError);

            await clearBasket(mockCall as any, mockCallback);

            expect(logger.error).toHaveBeenCalledWith(timeoutError);
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                })
            );
        });
    });

    describe('edge cases', () => {
        it('should handle missing userID in call.user', async () => {
            const mockCallWithoutUserID = {
                request: {},
                user: {}, // Missing userID
            };

            await clearBasket(mockCallWithoutUserID as any, mockCallback);

            // Should attempt to call getBasketByUserID with undefined
            expect(getBasketByUserID).toHaveBeenCalledWith(undefined);
        });

        it('should handle null userID', async () => {
            const mockCallNullUserID = {
                request: {},
                user: {
                    userID: null,
                },
            };

            await clearBasket(mockCallNullUserID as any, mockCallback);

            expect(getBasketByUserID).toHaveBeenCalledWith(null);
        });

        it('should handle empty string userID', async () => {
            const mockCallEmptyUserID = {
                request: {},
                user: {
                    userID: '',
                },
            };

            (getBasketByUserID as jest.Mock).mockResolvedValue(null);

            await clearBasket(mockCallEmptyUserID as any, mockCallback);

            expect(getBasketByUserID).toHaveBeenCalledWith('');
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Basket not found',
                    status: status.NOT_FOUND,
                })
            );
        });

        it('should handle basket with null or undefined id', async () => {
            const mockBasketNullId = {
                id: null,
                user_id: 'user-123',
            };

            (getBasketByUserID as jest.Mock).mockResolvedValue(mockBasketNullId);
            (deleteBasketByID as jest.Mock).mockResolvedValue(undefined);

            await clearBasket(mockCall as any, mockCallback);

            expect(deleteBasketByID).toHaveBeenCalledWith(null);
        });

        it('should handle basket with missing id property', async () => {
            const mockBasketNoId = {
                user_id: 'user-123',
                created_at: new Date(),
                // Missing id property
            };

            (getBasketByUserID as jest.Mock).mockResolvedValue(mockBasketNoId);
            (deleteBasketByID as jest.Mock).mockResolvedValue(undefined);

            await clearBasket(mockCall as any, mockCallback);

            expect(deleteBasketByID).toHaveBeenCalledWith(undefined);
        });

        it('should handle empty basket object', async () => {
            const emptyBasket = {};

            (getBasketByUserID as jest.Mock).mockResolvedValue(emptyBasket);
            (deleteBasketByID as jest.Mock).mockResolvedValue(undefined);

            await clearBasket(mockCall as any, mockCallback);

            expect(deleteBasketByID).toHaveBeenCalledWith(undefined);
        });
    });

    describe('function call order and dependencies', () => {
        it('should call functions in correct order', async () => {
            (getBasketByUserID as jest.Mock).mockResolvedValue(mockBasket);
            (deleteBasketByID as jest.Mock).mockResolvedValue(undefined);

            await clearBasket(mockCall as any, mockCallback);

            // Verify call order
            const getBasketCall = (getBasketByUserID as jest.Mock).mock.invocationCallOrder[0];
            const deleteBasketCall = (deleteBasketByID as jest.Mock).mock.invocationCallOrder[0];
            const callbackCall = mockCallback.mock.invocationCallOrder[0];

            expect(getBasketCall).toBeLessThan(deleteBasketCall);
            expect(deleteBasketCall).toBeLessThan(callbackCall);
        });

        it('should not call deleteBasketByID if basket not found', async () => {
            (getBasketByUserID as jest.Mock).mockResolvedValue(null);

            await clearBasket(mockCall as any, mockCallback);

            expect(getBasketByUserID).toHaveBeenCalled();
            expect(deleteBasketByID).not.toHaveBeenCalled();
        });

        it('should not call deleteBasketByID if getBasketByUserID fails', async () => {
            (getBasketByUserID as jest.Mock).mockRejectedValue(new Error('Database error'));

            await clearBasket(mockCall as any, mockCallback);

            expect(getBasketByUserID).toHaveBeenCalled();
            expect(deleteBasketByID).not.toHaveBeenCalled();
        });
    });

    describe('callback responses', () => {
        it('should always call callback with null as first parameter on success', async () => {
            (getBasketByUserID as jest.Mock).mockResolvedValue(mockBasket);
            (deleteBasketByID as jest.Mock).mockResolvedValue(undefined);

            await clearBasket(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null, // First parameter should always be null for gRPC success
                expect.any(Object)
            );
        });

        it('should always call callback with null as first parameter on error', async () => {
            (getBasketByUserID as jest.Mock).mockRejectedValue(new Error('Test error'));

            await clearBasket(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null, // First parameter should always be null, errors are in response object
                expect.any(Object)
            );
        });

        it('should include correct response structure on success', async () => {
            (getBasketByUserID as jest.Mock).mockResolvedValue(mockBasket);
            (deleteBasketByID as jest.Mock).mockResolvedValue(undefined);

            await clearBasket(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                {
                    message: 'Basket cleared successfully',
                    status: status.OK,
                }
            );
        });

        it('should include correct response structure on basket not found', async () => {
            (getBasketByUserID as jest.Mock).mockResolvedValue(null);

            await clearBasket(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                {
                    message: 'Basket not found',
                    status: status.NOT_FOUND,
                }
            );
        });

        it('should include correct response structure on internal error', async () => {
            (getBasketByUserID as jest.Mock).mockRejectedValue(new Error('Test error'));

            await clearBasket(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                {
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                }
            );
        });
    });

    describe('business logic validation', () => {
        it('should only clear basket belonging to authenticated user', async () => {
            const mockCallUser456 = {
                request: {},
                user: {
                    userID: 'user-456',
                },
            };

            (getBasketByUserID as jest.Mock).mockResolvedValue(mockBasket);
            (deleteBasketByID as jest.Mock).mockResolvedValue(undefined);

            await clearBasket(mockCallUser456 as any, mockCallback);

            // Verify lookup is done for the authenticated user, not basket owner
            expect(getBasketByUserID).toHaveBeenCalledWith('user-456');
            expect(getBasketByUserID).not.toHaveBeenCalledWith('user-123');
        });

        it('should complete deletion even if basket belongs to different user (edge case)', async () => {
            // This tests the current behavior - the handler doesn't validate basket ownership
            const basketForDifferentUser = {
                id: 'basket-999',
                user_id: 'different-user',
            };

            (getBasketByUserID as jest.Mock).mockResolvedValue(basketForDifferentUser);
            (deleteBasketByID as jest.Mock).mockResolvedValue(undefined);

            await clearBasket(mockCall as any, mockCallback);

            // Current implementation will delete any basket returned by getBasketByUserID
            expect(deleteBasketByID).toHaveBeenCalledWith('basket-999');
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Basket cleared successfully',
                    status: status.OK,
                })
            );
        });
    });

    describe('concurrent operation safety', () => {
        it('should handle case where basket is deleted between lookup and deletion', async () => {
            const basketNotFoundError = new Error('Basket not found for deletion');
            
            (getBasketByUserID as jest.Mock).mockResolvedValue(mockBasket);
            (deleteBasketByID as jest.Mock).mockRejectedValue(basketNotFoundError);

            await clearBasket(mockCall as any, mockCallback);

            // Should still log error and return internal error
            expect(logger.error).toHaveBeenCalledWith(basketNotFoundError);
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                })
            );
        });

        it('should handle multiple rapid clear requests gracefully', async () => {
            // First call succeeds
            (getBasketByUserID as jest.Mock).mockResolvedValueOnce(mockBasket);
            (deleteBasketByID as jest.Mock).mockResolvedValueOnce(undefined);

            await clearBasket(mockCall as any, mockCallback);

            // Second call finds no basket (already cleared)
            (getBasketByUserID as jest.Mock).mockResolvedValueOnce(null);

            await clearBasket(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenNthCalledWith(
                1,
                null,
                expect.objectContaining({
                    message: 'Basket cleared successfully',
                    status: status.OK,
                })
            );

            expect(mockCallback).toHaveBeenNthCalledWith(
                2,
                null,
                expect.objectContaining({
                    message: 'Basket not found',
                    status: status.NOT_FOUND,
                })
            );
        });
    });

    describe('request structure validation', () => {
        it('should handle request without any parameters', async () => {
            const mockCallEmptyRequest = {
                request: {},
                user: {
                    userID: 'user-123',
                },
            };

            (getBasketByUserID as jest.Mock).mockResolvedValue(mockBasket);
            (deleteBasketByID as jest.Mock).mockResolvedValue(undefined);

            await clearBasket(mockCallEmptyRequest as any, mockCallback);

            // Should work normally since clearBasket doesn't use request parameters
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Basket cleared successfully',
                    status: status.OK,
                })
            );
        });

        it('should ignore extra request parameters', async () => {
            const mockCallExtraParams = {
                request: {
                    extra_param: 'should-be-ignored',
                    another_param: 123,
                },
                user: {
                    userID: 'user-123',
                },
            };

            (getBasketByUserID as jest.Mock).mockResolvedValue(mockBasket);
            (deleteBasketByID as jest.Mock).mockResolvedValue(undefined);

            await clearBasket(mockCallExtraParams as any, mockCallback);

            // Should work normally and ignore extra parameters
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Basket cleared successfully',
                    status: status.OK,
                })
            );
        });

        it('should handle missing user object', async () => {
            const mockCallNoUser = {
                request: {},
                // Missing user object
            };

            // This will likely cause an error when trying to access call.user.userID
            await clearBasket(mockCallNoUser as any, mockCallback);

            // Should result in an error being caught and logged
            expect(logger.error).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                })
            );
        });
    });
});