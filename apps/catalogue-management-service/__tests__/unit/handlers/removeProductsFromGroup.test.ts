import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DefaultResponse,
    DefaultResponse__Output,
    RemoveProductsFromGroupRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getGroupByID,
    removeProductsByGroupID,
} from '../../../src/services/model.service';
import { removeProductsFromGroup } from '../../../src/handlers/removeProductsFromGroup';

// Mock all dependencies following the project pattern
jest.mock('@atc/common', () => ({
    errorMessage: {
        PRODUCT_GROUP: {
            NOT_FOUND: 'Product group not found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        PRODUCT_GROUP: {
            PRODUCTS_REMOVED: 'Products removed from group successfully',
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

describe('removeProductsFromGroup', () => {
    let mockCall: jest.Mocked<CustomServerUnaryCall<RemoveProductsFromGroupRequest__Output, DefaultResponse>>;
    let mockCallback: jest.MockedFunction<sendUnaryData<DefaultResponse__Output>>;
    let mockGetGroupByID: jest.MockedFunction<typeof getGroupByID>;
    let mockRemoveProductsByGroupID: jest.MockedFunction<typeof removeProductsByGroupID>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mocks
        mockGetGroupByID = getGroupByID as jest.MockedFunction<typeof getGroupByID>;
        mockRemoveProductsByGroupID = removeProductsByGroupID as jest.MockedFunction<typeof removeProductsByGroupID>;

        // Mock call object with default request
        mockCall = {
            request: {
                group_id: 'group-123',
                product_ids: ['product-1', 'product-2', 'product-3'],
            },
        } as any;

        // Mock callback function
        mockCallback = jest.fn();

        // Default mock implementations
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation((obj) => obj);
    });

    describe('Successful Operations', () => {
        it('should successfully remove multiple products from group', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-123',
                group_name: 'Electronics Group',
                type: 'CATEGORY',
                created_at: '2024-01-15T10:00:00Z',
                updated_at: '2024-01-15T11:00:00Z',
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockRemoveProductsByGroupID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(mockGetGroupByID).toHaveBeenCalledWith('group-123');
            expect(mockRemoveProductsByGroupID).toHaveBeenCalledWith('group-123', ['product-1', 'product-2', 'product-3']);

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products removed from group successfully',
                status: status.OK,
            });
        });

        it('should successfully remove single product from group', async () => {
            // Arrange
            mockCall.request = {
                group_id: 'group-single',
                product_ids: ['product-single'],
            } as any;

            const mockProductGroup = {
                id: 'group-single',
                group_name: 'Single Product Group',
                type: 'CUSTOM',
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockRemoveProductsByGroupID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetGroupByID).toHaveBeenCalledWith('group-single');
            expect(mockRemoveProductsByGroupID).toHaveBeenCalledWith('group-single', ['product-single']);

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products removed from group successfully',
                status: status.OK,
            });
        });

        it('should successfully handle empty product_ids array', async () => {
            // Arrange
            mockCall.request = {
                group_id: 'group-empty',
                product_ids: [],
            } as any;

            const mockProductGroup = {
                id: 'group-empty',
                group_name: 'Empty Products Group',
                type: 'TEMPORARY',
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockRemoveProductsByGroupID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockRemoveProductsByGroupID).toHaveBeenCalledWith('group-empty', []);

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products removed from group successfully',
                status: status.OK,
            });
        });

        it('should successfully handle large number of products', async () => {
            // Arrange
            const largeProductIdsList = Array.from({ length: 100 }, (_, index) => 
                `product-${index.toString().padStart(3, '0')}`
            );

            mockCall.request = {
                group_id: 'group-large',
                product_ids: largeProductIdsList,
            } as any;

            const mockProductGroup = {
                id: 'group-large',
                group_name: 'Large Products Group',
                type: 'BULK',
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockRemoveProductsByGroupID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockRemoveProductsByGroupID).toHaveBeenCalledWith('group-large', largeProductIdsList);
            expect(largeProductIdsList).toHaveLength(100);
            expect(largeProductIdsList[0]).toBe('product-000');
            expect(largeProductIdsList[99]).toBe('product-099');

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products removed from group successfully',
                status: status.OK,
            });
        });

        it('should properly clean request fields using utilFns.removeEmptyFields', async () => {
            // Arrange
            const requestWithEmptyFields = {
                group_id: 'group-clean',
                product_ids: ['product-a', 'product-b'],
                empty_field: '',
                null_field: null,
                undefined_field: undefined,
            };

            const cleanedRequest = {
                group_id: 'group-clean',
                product_ids: ['product-a', 'product-b'],
            };

            mockCall.request = requestWithEmptyFields as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const mockProductGroup = {
                id: 'group-clean',
                group_name: 'Clean Test Group',
                type: 'TEST',
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockRemoveProductsByGroupID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(mockGetGroupByID).toHaveBeenCalledWith('group-clean');
            expect(mockRemoveProductsByGroupID).toHaveBeenCalledWith('group-clean', ['product-a', 'product-b']);
        });
    });

    describe('Product ID Handling', () => {
        it('should handle product IDs with special characters', async () => {
            // Arrange
            const specialProductIds = [
                'product-with-dashes',
                'product_with_underscores',
                'product.with.dots',
                'product@with@symbols',
                'product#with#hash',
                'product%with%percent',
            ];

            mockCall.request = {
                group_id: 'group-special-chars',
                product_ids: specialProductIds,
            } as any;

            const mockProductGroup = {
                id: 'group-special-chars',
                group_name: 'Special Characters Group',
                type: 'SPECIAL',
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockRemoveProductsByGroupID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockRemoveProductsByGroupID).toHaveBeenCalledWith('group-special-chars', specialProductIds);

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products removed from group successfully',
                status: status.OK,
            });
        });

        it('should handle product IDs with unicode characters', async () => {
            // Arrange
            const unicodeProductIds = [
                'prodüct-ümlauts',
                'prodûct-âccents',
                'продукт-кириллица',
                '产品-中文',
                'منتج-عربي',
                'product-émojis-🎯',
            ];

            mockCall.request = {
                group_id: 'group-unicode',
                product_ids: unicodeProductIds,
            } as any;

            const mockProductGroup = {
                id: 'group-unicode',
                group_name: 'Unicode Products Group',
                type: 'INTERNATIONAL',
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockRemoveProductsByGroupID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockRemoveProductsByGroupID).toHaveBeenCalledWith('group-unicode', unicodeProductIds);

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products removed from group successfully',
                status: status.OK,
            });
        });

        it('should handle very long product IDs', async () => {
            // Arrange
            const longProductIds = [
                'a'.repeat(1000), // Very long product ID
                'b'.repeat(500),  // Medium long product ID
                'c'.repeat(100),  // Shorter but still long product ID
            ];

            mockCall.request = {
                group_id: 'group-long-ids',
                product_ids: longProductIds,
            } as any;

            const mockProductGroup = {
                id: 'group-long-ids',
                group_name: 'Long IDs Group',
                type: 'EDGE_CASE',
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockRemoveProductsByGroupID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockRemoveProductsByGroupID).toHaveBeenCalledWith('group-long-ids', longProductIds);
            expect(longProductIds[0]).toHaveLength(1000);
            expect(longProductIds[1]).toHaveLength(500);
            expect(longProductIds[2]).toHaveLength(100);

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products removed from group successfully',
                status: status.OK,
            });
        });

        it('should handle duplicate product IDs in the list', async () => {
            // Arrange
            const duplicateProductIds = [
                'product-1',
                'product-2',
                'product-1', // Duplicate
                'product-3',
                'product-2', // Another duplicate
                'product-1', // Third occurrence
            ];

            mockCall.request = {
                group_id: 'group-duplicates',
                product_ids: duplicateProductIds,
            } as any;

            const mockProductGroup = {
                id: 'group-duplicates',
                group_name: 'Duplicates Group',
                type: 'DUPLICATE_TEST',
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockRemoveProductsByGroupID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            // Should pass the duplicates as-is to the service layer
            expect(mockRemoveProductsByGroupID).toHaveBeenCalledWith('group-duplicates', duplicateProductIds);

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products removed from group successfully',
                status: status.OK,
            });
        });
    });

    describe('Error Handling', () => {
        it('should return NOT_FOUND when product group does not exist', async () => {
            // Arrange
            mockGetGroupByID.mockResolvedValue(null);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetGroupByID).toHaveBeenCalledWith('group-123');
            expect(mockRemoveProductsByGroupID).not.toHaveBeenCalled();
            
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product group not found',
                status: status.NOT_FOUND,
            });
        });

        it('should return NOT_FOUND when product group is undefined', async () => {
            // Arrange
            mockGetGroupByID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockRemoveProductsByGroupID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product group not found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle getGroupByID service error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            mockGetGroupByID.mockRejectedValue(mockError);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockRemoveProductsByGroupID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle removeProductsByGroupID service error', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-123',
                group_name: 'Test Group',
                type: 'TEST',
            };

            const mockRemoveError = new Error('Product removal operation failed');

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockRemoveProductsByGroupID.mockRejectedValue(mockRemoveError);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetGroupByID).toHaveBeenCalledWith('group-123');
            expect(mockRemoveProductsByGroupID).toHaveBeenCalledWith('group-123', ['product-1', 'product-2', 'product-3']);
            expect(logger.error).toHaveBeenCalledWith(mockRemoveError);
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
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockGetGroupByID).not.toHaveBeenCalled();
            expect(mockRemoveProductsByGroupID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle concurrent modification errors', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-concurrent',
                group_name: 'Concurrent Test Group',
                type: 'CONCURRENT',
            };

            const concurrentError = new Error('Concurrent modification detected');

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockRemoveProductsByGroupID.mockRejectedValue(concurrentError);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(concurrentError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing group_id in request', async () => {
            // Arrange
            const requestWithoutGroupId = {
                product_ids: ['product-1', 'product-2'],
            };

            const cleanedRequest = {
                product_ids: ['product-1', 'product-2'],
            };

            mockCall.request = requestWithoutGroupId as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            mockGetGroupByID.mockResolvedValue(null);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetGroupByID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product group not found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle missing product_ids in request', async () => {
            // Arrange
            const requestWithoutProductIds = {
                group_id: 'group-no-products',
            };

            const cleanedRequest = {
                group_id: 'group-no-products',
            };

            mockCall.request = requestWithoutProductIds as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const mockProductGroup = {
                id: 'group-no-products',
                group_name: 'No Products Group',
                type: 'EMPTY',
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockRemoveProductsByGroupID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockRemoveProductsByGroupID).toHaveBeenCalledWith('group-no-products', undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products removed from group successfully',
                status: status.OK,
            });
        });

        it('should handle empty string group_id', async () => {
            // Arrange
            mockCall.request = {
                group_id: '',
                product_ids: ['product-1'],
            } as any;

            mockGetGroupByID.mockResolvedValue(null);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetGroupByID).toHaveBeenCalledWith('');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product group not found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle very long group_id', async () => {
            // Arrange
            const longGroupId = 'g'.repeat(1000);
            mockCall.request = {
                group_id: longGroupId,
                product_ids: ['product-1'],
            } as any;

            mockGetGroupByID.mockResolvedValue(null);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetGroupByID).toHaveBeenCalledWith(longGroupId);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product group not found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle product group with special characters in data', async () => {
            // Arrange
            const mockProductGroupWithSpecialChars = {
                id: 'group-special-data',
                group_name: 'Spéçiál Grøup with Émojis 🎯',
                description: 'Ünicödé description & spëçiál çharaçtërs',
                type: 'SPÉÇIÁL_TYPÉ',
                metadata: {
                    tags: ['tãg-1', 'tàg-2', 'tág-3'],
                    notes: 'Nötës with Ünicödé',
                },
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroupWithSpecialChars);
            mockRemoveProductsByGroupID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockRemoveProductsByGroupID).toHaveBeenCalledWith('group-123', ['product-1', 'product-2', 'product-3']);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products removed from group successfully',
                status: status.OK,
            });
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle complete workflow with realistic data', async () => {
            // Arrange
            const realisticRequest = {
                group_id: 'electronics-smartphones-2024',
                product_ids: [
                    'iphone-15-pro-256gb',
                    'samsung-galaxy-s24-ultra',
                    'google-pixel-8-pro',
                    'oneplus-12-titanium',
                    'xiaomi-14-ultra-black',
                ],
                extra_param: 'should_be_removed',
                empty_string: '',
            };

            const cleanedRequest = {
                group_id: 'electronics-smartphones-2024',
                product_ids: [
                    'iphone-15-pro-256gb',
                    'samsung-galaxy-s24-ultra',
                    'google-pixel-8-pro',
                    'oneplus-12-titanium',
                    'xiaomi-14-ultra-black',
                ],
            };

            mockCall.request = realisticRequest as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const realisticProductGroup = {
                id: 'electronics-smartphones-2024',
                group_name: 'Premium Smartphones 2024',
                description: 'Collection of premium smartphone models for 2024',
                type: 'ELECTRONICS_CATEGORY',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-07-15T14:30:00Z',
                total_products: 25,
                active: true,
                metadata: {
                    category: 'Electronics',
                    subcategory: 'Smartphones',
                    season: '2024',
                    price_range: 'Premium',
                },
            };

            mockGetGroupByID.mockResolvedValue(realisticProductGroup);
            mockRemoveProductsByGroupID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(realisticRequest);
            expect(mockGetGroupByID).toHaveBeenCalledWith('electronics-smartphones-2024');
            expect(mockRemoveProductsByGroupID).toHaveBeenCalledWith(
                'electronics-smartphones-2024',
                [
                    'iphone-15-pro-256gb',
                    'samsung-galaxy-s24-ultra',
                    'google-pixel-8-pro',
                    'oneplus-12-titanium',
                    'xiaomi-14-ultra-black',
                ]
            );

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products removed from group successfully',
                status: status.OK,
            });
        });

        it('should handle batch removal operations', async () => {
            // Arrange
            const batchProductIds = [];
            for (let i = 1; i <= 50; i++) {
                batchProductIds.push(`batch-product-${i.toString().padStart(3, '0')}`);
            }

            mockCall.request = {
                group_id: 'batch-removal-group',
                product_ids: batchProductIds,
            } as any;

            const batchProductGroup = {
                id: 'batch-removal-group',
                group_name: 'Batch Removal Test Group',
                type: 'BATCH_OPERATIONS',
                total_products: 100,
            };

            mockGetGroupByID.mockResolvedValue(batchProductGroup);
            mockRemoveProductsByGroupID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockRemoveProductsByGroupID).toHaveBeenCalledWith('batch-removal-group', batchProductIds);
            expect(batchProductIds).toHaveLength(50);
            expect(batchProductIds[0]).toBe('batch-product-001');
            expect(batchProductIds[49]).toBe('batch-product-050');

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products removed from group successfully',
                status: status.OK,
            });
        });

        it('should handle idempotent operations - removing non-existent products', async () => {
            // Arrange
            mockCall.request = {
                group_id: 'idempotent-group',
                product_ids: [
                    'non-existent-product-1',
                    'non-existent-product-2',
                    'product-that-was-already-removed',
                ],
            } as any;

            const idempotentGroup = {
                id: 'idempotent-group',
                group_name: 'Idempotent Operations Group',
                type: 'IDEMPOTENT_TEST',
            };

            mockGetGroupByID.mockResolvedValue(idempotentGroup);
            // The service layer should handle non-existent products gracefully
            mockRemoveProductsByGroupID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockRemoveProductsByGroupID).toHaveBeenCalledWith('idempotent-group', [
                'non-existent-product-1',
                'non-existent-product-2',
                'product-that-was-already-removed',
            ]);

            // Should still return success - idempotent operation
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products removed from group successfully',
                status: status.OK,
            });
        });
    });

    describe('Service Layer Integration', () => {
        it('should call service functions in correct order', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'order-test-group',
                group_name: 'Order Test Group',
                type: 'ORDER_TEST',
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockRemoveProductsByGroupID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            // Verify the order of service calls
            const getGroupCallOrder = mockGetGroupByID.mock.invocationCallOrder[0];
            const removeProductsCallOrder = mockRemoveProductsByGroupID.mock.invocationCallOrder[0];
            
            expect(getGroupCallOrder).toBeLessThan(removeProductsCallOrder);
        });

        it('should not call removeProductsByGroupID if group validation fails', async () => {
            // Arrange
            mockGetGroupByID.mockResolvedValue(null);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetGroupByID).toHaveBeenCalled();
            expect(mockRemoveProductsByGroupID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product group not found',
                status: status.NOT_FOUND,
            });
        });

        it('should pass exact parameters to service functions', async () => {
            // Arrange
            const specificGroupId = 'specific-test-group-id-12345';
            const specificProductIds = [
                'specific-product-alpha',
                'specific-product-beta',
                'specific-product-gamma',
            ];

            mockCall.request = {
                group_id: specificGroupId,
                product_ids: specificProductIds,
            } as any;

            const mockProductGroup = {
                id: specificGroupId,
                group_name: 'Specific Test Group',
                type: 'SPECIFIC_TEST',
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockRemoveProductsByGroupID.mockResolvedValue(undefined);

            // Act
            await removeProductsFromGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetGroupByID).toHaveBeenCalledWith(specificGroupId);
            expect(mockRemoveProductsByGroupID).toHaveBeenCalledWith(specificGroupId, specificProductIds);
            
            // Verify exact parameter matching
            const getGroupCall = mockGetGroupByID.mock.calls[0];
            const removeProductsCall = mockRemoveProductsByGroupID.mock.calls[0];
            
            expect(getGroupCall[0]).toBe(specificGroupId);
            expect(removeProductsCall[0]).toBe(specificGroupId);
            expect(removeProductsCall[1]).toBe(specificProductIds);
        });
    });
});