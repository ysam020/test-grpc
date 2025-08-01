import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DefaultResponse,
    DefaultResponse__Output,
    ToggleManualMatchRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getAdvertisementItemByID,
    setIsMatchedToFalse,
} from '../../../src/services/model.service';
import { toggleManualMatch } from '../../../src/handlers/toggleManualMatchAdItem';

// Mock all dependencies following the project pattern
jest.mock('@atc/common', () => ({
    errorMessage: {
        ADVERTISEMENT: {
            ADVERTISEMENT_ITEM_NOT_FOUND: 'Advertisement item not found',
            CANNOT_TOGGLE_TO_MATCHED: 'Cannot toggle to matched state - item is not currently matched',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        ADVERTISEMENT: {
            ADVERTISEMENT_ITEM_UPDATED: 'Advertisement item updated successfully',
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

describe('toggleManualMatch', () => {
    let mockCall: jest.Mocked<CustomServerUnaryCall<ToggleManualMatchRequest__Output, DefaultResponse>>;
    let mockCallback: jest.MockedFunction<sendUnaryData<DefaultResponse__Output>>;
    let mockGetAdvertisementItemByID: jest.MockedFunction<typeof getAdvertisementItemByID>;
    let mockSetIsMatchedToFalse: jest.MockedFunction<typeof setIsMatchedToFalse>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mocks
        mockGetAdvertisementItemByID = getAdvertisementItemByID as jest.MockedFunction<typeof getAdvertisementItemByID>;
        mockSetIsMatchedToFalse = setIsMatchedToFalse as jest.MockedFunction<typeof setIsMatchedToFalse>;

        // Mock call object with default request
        mockCall = {
            request: {
                ad_item_id: 'ad-item-123',
            },
        } as any;

        // Mock callback function
        mockCallback = jest.fn();

        // Default mock implementations
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation((obj) => obj);
    });

    describe('Successful Operations', () => {
        it('should successfully toggle manual match from matched to unmatched', async () => {
            // Arrange
            const mockMatchedAdvertisementItem = {
                id: 'ad-item-123',
                title: 'Matched Advertisement Item',
                description: 'A previously matched advertisement item',
                is_matched: true,
                match_confidence: 0.95,
                x_coordinate: 100,
                y_coordinate: 150,
                width: 200,
                height: 100,
                advertisement_id: 'ad-123',
                matched_product_id: 'product-456',
                created_at: '2024-01-15T10:00:00Z',
                updated_at: '2024-01-15T11:00:00Z',
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockMatchedAdvertisementItem);
            mockSetIsMatchedToFalse.mockResolvedValue(undefined);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith('ad-item-123');
            expect(mockSetIsMatchedToFalse).toHaveBeenCalledWith('ad-item-123');

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item updated successfully',
                status: status.OK,
            });
        });

        it('should handle advertisement item with minimal matched data', async () => {
            // Arrange
            const mockMinimalMatchedItem = {
                id: 'ad-item-minimal',
                title: 'Minimal Matched Item',
                is_matched: true,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockMinimalMatchedItem);
            mockSetIsMatchedToFalse.mockResolvedValue(undefined);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(mockSetIsMatchedToFalse).toHaveBeenCalledWith('ad-item-123');

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item updated successfully',
                status: status.OK,
            });
        });

        it('should handle advertisement item with complex matched data', async () => {
            // Arrange
            const mockComplexMatchedItem = {
                id: 'ad-item-complex',
                title: 'Complex Matched Advertisement Item',
                description: 'A complex advertisement item with full matching data',
                is_matched: true,
                match_confidence: 0.98,
                match_type: 'AUTOMATIC',
                matched_at: '2024-01-15T12:30:00Z',
                x_coordinate: 250,
                y_coordinate: 300,
                width: 400,
                height: 250,
                advertisement_id: 'complex-ad-789',
                matched_product: {
                    id: 'product-complex-123',
                    name: 'Complex Product',
                    brand: 'Test Brand',
                    price: 199.99,
                },
                matching_metadata: {
                    algorithm_version: '2.1.0',
                    processing_time_ms: 1250,
                    alternative_matches: 3,
                },
                created_at: '2024-01-15T09:00:00Z',
                updated_at: '2024-01-15T12:35:00Z',
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockComplexMatchedItem);
            mockSetIsMatchedToFalse.mockResolvedValue(undefined);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(mockSetIsMatchedToFalse).toHaveBeenCalledWith('ad-item-123');

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item updated successfully',
                status: status.OK,
            });
        });

        it('should properly clean request fields using utilFns.removeEmptyFields', async () => {
            // Arrange
            const requestWithEmptyFields = {
                ad_item_id: 'ad-item-clean',
                empty_field: '',
                null_field: null,
                undefined_field: undefined,
            };

            const cleanedRequest = {
                ad_item_id: 'ad-item-clean',
            };

            mockCall.request = requestWithEmptyFields as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const mockMatchedItem = {
                id: 'ad-item-clean',
                title: 'Clean Test Item',
                is_matched: true,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockMatchedItem);
            mockSetIsMatchedToFalse.mockResolvedValue(undefined);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith('ad-item-clean');
            expect(mockSetIsMatchedToFalse).toHaveBeenCalledWith('ad-item-clean');
        });
    });

    describe('Business Logic Validation', () => {
        it('should only allow toggle from matched (true) to unmatched (false)', async () => {
            // Arrange - Test with is_matched: true
            const mockMatchedItem = {
                id: 'ad-item-matched-true',
                title: 'Matched Item',
                is_matched: true,
                match_confidence: 0.87,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockMatchedItem);
            mockSetIsMatchedToFalse.mockResolvedValue(undefined);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(mockSetIsMatchedToFalse).toHaveBeenCalledWith('ad-item-123');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item updated successfully',
                status: status.OK,
            });
        });

        it('should validate is_matched state before allowing toggle', async () => {
            // Test that the function checks the current state before proceeding
            const testCases = [
                {
                    is_matched: true,
                    description: 'matched item',
                    shouldSucceed: true,
                },
                {
                    is_matched: false,
                    description: 'unmatched item',
                    shouldSucceed: false,
                },
            ];

            for (const testCase of testCases) {
                jest.clearAllMocks();

                const mockItem = {
                    id: `ad-item-${testCase.description.replace(' ', '-')}`,
                    title: `Test ${testCase.description}`,
                    is_matched: testCase.is_matched,
                };

                mockGetAdvertisementItemByID.mockResolvedValue(mockItem);
                mockSetIsMatchedToFalse.mockResolvedValue(undefined);

                // Act
                await toggleManualMatch(mockCall, mockCallback);

                // Assert
                if (testCase.shouldSucceed) {
                    expect(mockSetIsMatchedToFalse).toHaveBeenCalledWith('ad-item-123');
                    expect(mockCallback).toHaveBeenCalledWith(null, {
                        message: 'Advertisement item updated successfully',
                        status: status.OK,
                    });
                } else {
                    expect(mockSetIsMatchedToFalse).not.toHaveBeenCalled();
                    expect(mockCallback).toHaveBeenCalledWith(null, {
                        message: 'Cannot toggle to matched state - item is not currently matched',
                        status: status.FAILED_PRECONDITION,
                    });
                }
            }
        });

        it('should handle is_matched with different truthy/falsy values', async () => {
            // Test various truthy/falsy values for is_matched
            const testCases = [
                { is_matched: true, shouldSucceed: true, description: 'boolean true' },
                { is_matched: 1, shouldSucceed: true, description: 'number 1' },
                { is_matched: 'true', shouldSucceed: true, description: 'string true' },
                { is_matched: 'yes', shouldSucceed: true, description: 'string yes' },
                { is_matched: false, shouldSucceed: false, description: 'boolean false' },
                { is_matched: 0, shouldSucceed: false, description: 'number 0' },
                { is_matched: '', shouldSucceed: false, description: 'empty string' },
                { is_matched: null, shouldSucceed: false, description: 'null' },
                { is_matched: undefined, shouldSucceed: false, description: 'undefined' },
            ];

            for (const testCase of testCases) {
                jest.clearAllMocks();

                const mockItem = {
                    id: 'ad-item-truthy-test',
                    title: `Test ${testCase.description}`,
                    is_matched: testCase.is_matched,
                };

                mockGetAdvertisementItemByID.mockResolvedValue(mockItem);
                mockSetIsMatchedToFalse.mockResolvedValue(undefined);

                // Act
                await toggleManualMatch(mockCall, mockCallback);

                // Assert
                if (testCase.shouldSucceed) {
                    expect(mockSetIsMatchedToFalse).toHaveBeenCalledWith('ad-item-123');
                    expect(mockCallback).toHaveBeenCalledWith(null, {
                        message: 'Advertisement item updated successfully',
                        status: status.OK,
                    });
                } else {
                    expect(mockSetIsMatchedToFalse).not.toHaveBeenCalled();
                    expect(mockCallback).toHaveBeenCalledWith(null, {
                        message: 'Cannot toggle to matched state - item is not currently matched',
                        status: status.FAILED_PRECONDITION,
                    });
                }
            }
        });
    });

    describe('Error Handling - Advertisement Item Not Found', () => {
        it('should return NOT_FOUND when advertisement item does not exist', async () => {
            // Arrange
            mockGetAdvertisementItemByID.mockResolvedValue(null);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith('ad-item-123');
            expect(mockSetIsMatchedToFalse).not.toHaveBeenCalled();
            
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item not found',
                status: status.NOT_FOUND,
            });
        });

        it('should return NOT_FOUND when advertisement item is undefined', async () => {
            // Arrange
            mockGetAdvertisementItemByID.mockResolvedValue(undefined);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(mockSetIsMatchedToFalse).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item not found',
                status: status.NOT_FOUND,
            });
        });
    });

    describe('Error Handling - Failed Precondition', () => {
        it('should return FAILED_PRECONDITION when advertisement item is not matched', async () => {
            // Arrange
            const mockUnmatchedItem = {
                id: 'ad-item-unmatched',
                title: 'Unmatched Advertisement Item',
                description: 'An advertisement item that is not currently matched',
                is_matched: false,
                x_coordinate: 100,
                y_coordinate: 150,
                width: 200,
                height: 100,
                advertisement_id: 'ad-789',
                created_at: '2024-01-15T10:00:00Z',
                updated_at: '2024-01-15T10:00:00Z',
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockUnmatchedItem);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith('ad-item-123');
            expect(mockSetIsMatchedToFalse).not.toHaveBeenCalled();
            
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Cannot toggle to matched state - item is not currently matched',
                status: status.FAILED_PRECONDITION,
            });
        });

        it('should return FAILED_PRECONDITION for various falsy is_matched values', async () => {
            const falsyValues = [false, 0, '', null, undefined];

            for (const falsyValue of falsyValues) {
                jest.clearAllMocks();

                const mockUnmatchedItem = {
                    id: 'ad-item-falsy',
                    title: 'Falsy Matched Item',
                    is_matched: falsyValue,
                };

                mockGetAdvertisementItemByID.mockResolvedValue(mockUnmatchedItem);

                // Act
                await toggleManualMatch(mockCall, mockCallback);

                // Assert
                expect(mockSetIsMatchedToFalse).not.toHaveBeenCalled();
                expect(mockCallback).toHaveBeenCalledWith(null, {
                    message: 'Cannot toggle to matched state - item is not currently matched',
                    status: status.FAILED_PRECONDITION,
                });
            }
        });
    });

    describe('Error Handling - Service Errors', () => {
        it('should handle getAdvertisementItemByID service error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            mockGetAdvertisementItemByID.mockRejectedValue(mockError);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockSetIsMatchedToFalse).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle setIsMatchedToFalse service error', async () => {
            // Arrange
            const mockMatchedItem = {
                id: 'ad-item-update-error',
                title: 'Update Error Item',
                is_matched: true,
            };

            const mockUpdateError = new Error('Update operation failed');

            mockGetAdvertisementItemByID.mockResolvedValue(mockMatchedItem);
            mockSetIsMatchedToFalse.mockRejectedValue(mockUpdateError);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith('ad-item-123');
            expect(mockSetIsMatchedToFalse).toHaveBeenCalledWith('ad-item-123');
            expect(logger.error).toHaveBeenCalledWith(mockUpdateError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle utilFns.removeEmptyFields error', async () => {
            // Arrange
            const mockError = new Error('Field removal failed');
            (utilFns.removeEmptyFields as jest.Mock).mockImplementation(() => {
                throw mockError;
            });

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockGetAdvertisementItemByID).not.toHaveBeenCalled();
            expect(mockSetIsMatchedToFalse).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle concurrent modification errors', async () => {
            // Arrange
            const mockMatchedItem = {
                id: 'ad-item-concurrent',
                title: 'Concurrent Test Item',
                is_matched: true,
            };

            const concurrentError = new Error('Concurrent modification detected');

            mockGetAdvertisementItemByID.mockResolvedValue(mockMatchedItem);
            mockSetIsMatchedToFalse.mockRejectedValue(concurrentError);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(concurrentError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing ad_item_id in request', async () => {
            // Arrange
            const requestWithoutId = {};
            const cleanedRequest = {};

            mockCall.request = requestWithoutId as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            mockGetAdvertisementItemByID.mockResolvedValue(null);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item not found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle empty string ad_item_id', async () => {
            // Arrange
            mockCall.request = { ad_item_id: '' } as any;

            mockGetAdvertisementItemByID.mockResolvedValue(null);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith('');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item not found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle very long ad_item_id', async () => {
            // Arrange
            const longAdItemId = 'a'.repeat(1000);
            mockCall.request = { ad_item_id: longAdItemId } as any;

            mockGetAdvertisementItemByID.mockResolvedValue(null);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith(longAdItemId);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item not found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle advertisement item with special characters in data', async () => {
            // Arrange
            const mockSpecialCharsItem = {
                id: 'ad-item-special-chars',
                title: 'Spéçiál Advërtisemënt Itëm with Émojis 🎯📱',
                description: 'Ünicödé tëxt & spëçiál çharaçtërs in advërtisëmënt',
                is_matched: true,
                metadata: {
                    tags: ['tãg-1', 'tàg-2', 'tág-3'],
                    notes: 'Nötës with Ünicödé çharaçtërs',
                },
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockSpecialCharsItem);
            mockSetIsMatchedToFalse.mockResolvedValue(undefined);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(mockSetIsMatchedToFalse).toHaveBeenCalledWith('ad-item-123');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item updated successfully',
                status: status.OK,
            });
        });

        it('should handle advertisement item with null/undefined properties', async () => {
            // Arrange
            const mockItemWithNullProps = {
                id: 'ad-item-null-props',
                title: null,
                description: undefined,
                is_matched: true,
                x_coordinate: null,
                y_coordinate: undefined,
                metadata: null,
                created_at: null,
                updated_at: undefined,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockItemWithNullProps);
            mockSetIsMatchedToFalse.mockResolvedValue(undefined);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(mockSetIsMatchedToFalse).toHaveBeenCalledWith('ad-item-123');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item updated successfully',
                status: status.OK,
            });
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle complete workflow with realistic data', async () => {
            // Arrange
            const realisticRequest = {
                ad_item_id: 'summer-banner-smartphone-item-2024',
                extra_param: 'should_be_removed',
                empty_string: '',
            };

            const cleanedRequest = {
                ad_item_id: 'summer-banner-smartphone-item-2024',
            };

            mockCall.request = realisticRequest as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const realisticMatchedItem = {
                id: 'summer-banner-smartphone-item-2024',
                title: 'iPhone 15 Pro in Summer Banner',
                description: 'Premium smartphone featured prominently in summer sale advertisement',
                is_matched: true,
                match_confidence: 0.96,
                match_type: 'AUTOMATIC',
                matched_at: '2024-06-15T14:30:00Z',
                x_coordinate: 320,
                y_coordinate: 180,
                width: 280,
                height: 350,
                advertisement_id: 'summer-electronics-sale-2024',
                matched_product: {
                    id: 'iphone-15-pro-256gb-titanium',
                    name: 'iPhone 15 Pro 256GB Titanium Blue',
                    brand: 'Apple',
                    price: 1199.99,
                    category: 'Smartphones',
                    sku: 'APPL-IP15P-256-TB',
                },
                matching_metadata: {
                    algorithm_version: '3.2.1',
                    processing_time_ms: 1850,
                    confidence_breakdown: {
                        visual_similarity: 0.98,
                        text_recognition: 0.94,
                        brand_detection: 0.96,
                    },
                    alternative_matches: [
                        { product_id: 'iphone-15-256gb', confidence: 0.89 },
                        { product_id: 'iphone-15-pro-128gb', confidence: 0.85 },
                    ],
                },
                created_at: '2024-06-01T09:00:00Z',
                updated_at: '2024-06-15T14:35:00Z',
            };

            mockGetAdvertisementItemByID.mockResolvedValue(realisticMatchedItem);
            mockSetIsMatchedToFalse.mockResolvedValue(undefined);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(realisticRequest);
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith('summer-banner-smartphone-item-2024');
            expect(mockSetIsMatchedToFalse).toHaveBeenCalledWith('summer-banner-smartphone-item-2024');

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item updated successfully',
                status: status.OK,
            });
        });

        it('should handle workflow with previously unmatched item (should fail)', async () => {
            // Arrange
            const unmatchedWorkflowRequest = {
                ad_item_id: 'unmatched-item-workflow-test',
            };

            mockCall.request = unmatchedWorkflowRequest as any;

            const realisticUnmatchedItem = {
                id: 'unmatched-item-workflow-test',
                title: 'Unidentified Product in Banner',
                description: 'Product that could not be automatically matched',
                is_matched: false,
                match_confidence: 0.45, // Low confidence, below threshold
                match_attempts: 3,
                last_match_attempt: '2024-06-15T10:30:00Z',
                x_coordinate: 150,
                y_coordinate: 220,
                width: 180,
                height: 200,
                advertisement_id: 'complex-electronics-banner-2024',
                failed_match_reasons: [
                    'Low visual similarity',
                    'Unclear product boundaries',
                    'Insufficient training data',
                ],
                created_at: '2024-06-01T09:00:00Z',
                updated_at: '2024-06-15T10:35:00Z',
            };

            mockGetAdvertisementItemByID.mockResolvedValue(realisticUnmatchedItem);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith('unmatched-item-workflow-test');
            expect(mockSetIsMatchedToFalse).not.toHaveBeenCalled();

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Cannot toggle to matched state - item is not currently matched',
                status: status.FAILED_PRECONDITION,
            });
        });
    });

    describe('Service Layer Integration', () => {
        it('should call service functions in correct order', async () => {
            // Arrange
            const mockMatchedItem = {
                id: 'order-test-item',
                title: 'Order Test Item',
                is_matched: true,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockMatchedItem);
            mockSetIsMatchedToFalse.mockResolvedValue(undefined);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            // Verify the order of service calls
            const getItemCallOrder = mockGetAdvertisementItemByID.mock.invocationCallOrder[0];
            const setIsMatchedCallOrder = mockSetIsMatchedToFalse.mock.invocationCallOrder[0];
            
            expect(getItemCallOrder).toBeLessThan(setIsMatchedCallOrder);
        });

        it('should not call setIsMatchedToFalse if item validation fails', async () => {
            // Test both NOT_FOUND and FAILED_PRECONDITION scenarios
            const testCases = [
                {
                    mockResult: null,
                    description: 'item not found',
                    expectedStatus: status.NOT_FOUND,
                },
                {
                    mockResult: { id: 'test', title: 'Test', is_matched: false },
                    description: 'item not matched',
                    expectedStatus: status.FAILED_PRECONDITION,
                },
            ];

            for (const testCase of testCases) {
                jest.clearAllMocks();

                mockGetAdvertisementItemByID.mockResolvedValue(testCase.mockResult);

                // Act
                await toggleManualMatch(mockCall, mockCallback);

                // Assert
                expect(mockGetAdvertisementItemByID).toHaveBeenCalled();
                expect(mockSetIsMatchedToFalse).not.toHaveBeenCalled();
                expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
                    status: testCase.expectedStatus,
                }));
            }
        });

        it('should pass exact parameters to service functions', async () => {
            // Arrange
            const specificAdItemId = 'specific-test-ad-item-id-12345';

            mockCall.request = { ad_item_id: specificAdItemId } as any;

            const mockMatchedItem = {
                id: specificAdItemId,
                title: 'Specific Test Item',
                is_matched: true,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockMatchedItem);
            mockSetIsMatchedToFalse.mockResolvedValue(undefined);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith(specificAdItemId);
            expect(mockSetIsMatchedToFalse).toHaveBeenCalledWith(specificAdItemId);
            
            // Verify exact parameter matching
            const getItemCall = mockGetAdvertisementItemByID.mock.calls[0];
            const setIsMatchedCall = mockSetIsMatchedToFalse.mock.calls[0];
            
            expect(getItemCall[0]).toBe(specificAdItemId);
            expect(setIsMatchedCall[0]).toBe(specificAdItemId);
        });

        it('should handle service function return values correctly', async () => {
            // Arrange
            const mockMatchedItem = {
                id: 'return-value-test',
                title: 'Return Value Test Item',
                is_matched: true,
                additional_data: 'should_not_affect_flow',
            };

            // Test that return values are handled correctly
            mockGetAdvertisementItemByID.mockResolvedValue(mockMatchedItem);
            mockSetIsMatchedToFalse.mockResolvedValue(undefined); // Void return

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item updated successfully',
                status: status.OK,
            });
        });
    });

    describe('State Transition Logic', () => {
        it('should only support unidirectional toggle (matched -> unmatched)', async () => {
            // This test verifies the business rule that toggle only works one way
            const stateTestCases = [
                {
                    initialState: true,
                    expectedToSucceed: true,
                    description: 'matched to unmatched (allowed)',
                },
                {
                    initialState: false,
                    expectedToSucceed: false,
                    description: 'unmatched to matched (not allowed)',
                },
            ];

            for (const testCase of stateTestCases) {
                jest.clearAllMocks();

                const mockItem = {
                    id: 'state-transition-test',
                    title: `State Transition Test - ${testCase.description}`,
                    is_matched: testCase.initialState,
                };

                mockGetAdvertisementItemByID.mockResolvedValue(mockItem);
                mockSetIsMatchedToFalse.mockResolvedValue(undefined);

                // Act
                await toggleManualMatch(mockCall, mockCallback);

                // Assert
                if (testCase.expectedToSucceed) {
                    expect(mockSetIsMatchedToFalse).toHaveBeenCalledWith('ad-item-123');
                    expect(mockCallback).toHaveBeenCalledWith(null, {
                        message: 'Advertisement item updated successfully',
                        status: status.OK,
                    });
                } else {
                    expect(mockSetIsMatchedToFalse).not.toHaveBeenCalled();
                    expect(mockCallback).toHaveBeenCalledWith(null, {
                        message: 'Cannot toggle to matched state - item is not currently matched',
                        status: status.FAILED_PRECONDITION,
                    });
                }
            }
        });

        it('should validate state transition preconditions', async () => {
            // Test the specific business logic around state validation
            const mockMatchedItem = {
                id: 'precondition-test',
                title: 'Precondition Test Item',
                is_matched: true,
                match_type: 'MANUAL',
                confidence: 1.0,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockMatchedItem);
            mockSetIsMatchedToFalse.mockResolvedValue(undefined);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert - Should succeed because precondition (is_matched: true) is met
            expect(mockSetIsMatchedToFalse).toHaveBeenCalledWith('ad-item-123');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item updated successfully',
                status: status.OK,
            });
        });
    });

    describe('Function Behavior Validation', () => {
        it('should always call setIsMatchedToFalse (never true) when conditions are met', async () => {
            // Verify that the function specifically sets is_matched to false
            const mockMatchedItem = {
                id: 'set-false-test',
                title: 'Set False Test Item',
                is_matched: true,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockMatchedItem);
            mockSetIsMatchedToFalse.mockResolvedValue(undefined);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert - Specifically verify setIsMatchedToFalse is called (not a generic update)
            expect(mockSetIsMatchedToFalse).toHaveBeenCalledWith('ad-item-123');
            expect(mockSetIsMatchedToFalse).toHaveBeenCalledTimes(1);
        });

        it('should complete full workflow for valid matched items', async () => {
            // Test the complete happy path workflow
            const mockValidMatchedItem = {
                id: 'workflow-test',
                title: 'Complete Workflow Test Item',
                is_matched: true,
                match_confidence: 0.92,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockValidMatchedItem);
            mockSetIsMatchedToFalse.mockResolvedValue(undefined);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert - Verify complete workflow
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith('ad-item-123');
            expect(mockSetIsMatchedToFalse).toHaveBeenCalledWith('ad-item-123');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item updated successfully',
                status: status.OK,
            });

            // Verify no errors were logged
            expect(logger.error).not.toHaveBeenCalled();
        });

        it('should handle edge case of item existing but having missing is_matched property', async () => {
            // Test item that exists but doesn't have is_matched property
            const mockItemWithoutIsMatched = {
                id: 'no-is-matched-prop',
                title: 'Item Without is_matched Property',
                // is_matched property is missing entirely
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockItemWithoutIsMatched);

            // Act
            await toggleManualMatch(mockCall, mockCallback);

            // Assert - Should treat missing property as falsy
            expect(mockSetIsMatchedToFalse).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Cannot toggle to matched state - item is not currently matched',
                status: status.FAILED_PRECONDITION,
            });
        });
    });
});