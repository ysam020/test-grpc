import { jest } from '@jest/globals';
import { status } from '@grpc/grpc-js';

// Mock business logic dependencies BEFORE importing the handler
jest.mock('@atc/common', () => ({
    errorMessage: {
        PRODUCT_GROUP: {
            NOT_FOUND: 'Product Group Not Found',
        },
        PRODUCT: {
            NOT_FOUND: 'Product Not Found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something Went Wrong',
        },
    },
    responseMessage: {
        PRODUCT_GROUP: {
            PRODUCTS_ATTACHED: 'Products Attached successfully',
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
        trace: jest.fn(),
        fatal: jest.fn(),
    },
}));

jest.mock('../../../src/services/client.service', () => ({
    getProductByIDs: jest.fn(),
}));

jest.mock('../../../src/services/model.service', () => ({
    getGroupByID: jest.fn(),
    createProductGroupProducts: jest.fn(),
    removeProductsByGroupID: jest.fn(),
}));

// Import after mocks
import { attachProductsToGroup } from '../../../src/handlers/attachProductsToGroup';
import { getProductByIDs } from '../../../src/services/client.service';
import {
    getGroupByID,
    createProductGroupProducts,
    removeProductsByGroupID,
} from '../../../src/services/model.service';
import { utilFns } from '@atc/common';
import { logger } from '@atc/logger';

describe('attachProductsToGroup Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        
        mockCall = {
            request: {
                group_id: 'group-123',
                product_ids: ['product-1', 'product-2', 'product-3'],
            },
            metadata: {
                get: jest.fn().mockReturnValue(['test-metadata']),
                add: jest.fn(),
                set: jest.fn(),
            },
        };

        // Setup default mock implementations
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation((data) => data);
    });

    describe('Successful scenarios', () => {
        it('should successfully attach products to group when all conditions are met', async () => {
            // Arrange
            const mockGroup = {
                id: 'group-123',
                name: 'Test Group',
                ProductGroupProduct: [
                    { product_id: 'old-product-1' },
                    { product_id: 'old-product-2' },
                ],
            };

            const mockProducts = [
                { id: 'product-1', name: 'Product 1' },
                { id: 'product-2', name: 'Product 2' },
                { id: 'product-3', name: 'Product 3' },
            ];

            (getGroupByID as jest.Mock).mockResolvedValue(mockGroup);
            (getProductByIDs as jest.Mock).mockResolvedValue(mockProducts);
            (removeProductsByGroupID as jest.Mock).mockResolvedValue(true);
            (createProductGroupProducts as jest.Mock).mockResolvedValue(true);

            // Act
            await attachProductsToGroup(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(getGroupByID).toHaveBeenCalledWith('group-123');
            expect(getProductByIDs).toHaveBeenCalledWith(['product-1', 'product-2', 'product-3'], mockCall.metadata);
            expect(removeProductsByGroupID).toHaveBeenCalledWith('group-123', ['old-product-1', 'old-product-2']);
            expect(createProductGroupProducts).toHaveBeenCalledWith('group-123', ['product-1', 'product-2', 'product-3']);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products Attached successfully',
                status: status.OK,
            });
        });

        it('should successfully attach products without removing any existing products when they overlap', async () => {
            // Arrange
            const mockGroup = {
                id: 'group-123',
                name: 'Test Group',
                ProductGroupProduct: [
                    { product_id: 'product-1' }, // This product exists in both old and new
                    { product_id: 'product-2' }, // This product exists in both old and new
                ],
            };

            const mockProducts = [
                { id: 'product-1', name: 'Product 1' },
                { id: 'product-2', name: 'Product 2' },
                { id: 'product-3', name: 'Product 3' },
            ];

            (getGroupByID as jest.Mock).mockResolvedValue(mockGroup);
            (getProductByIDs as jest.Mock).mockResolvedValue(mockProducts);
            (createProductGroupProducts as jest.Mock).mockResolvedValue(true);

            // Act
            await attachProductsToGroup(mockCall, mockCallback);

            // Assert
            expect(removeProductsByGroupID).not.toHaveBeenCalled(); // No products to remove
            expect(createProductGroupProducts).toHaveBeenCalledWith('group-123', ['product-1', 'product-2', 'product-3']);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products Attached successfully',
                status: status.OK,
            });
        });

        it('should handle empty existing products in group', async () => {
            // Arrange
            const mockGroup = {
                id: 'group-123',
                name: 'Test Group',
                ProductGroupProduct: [], // Empty existing products
            };

            const mockProducts = [
                { id: 'product-1', name: 'Product 1' },
                { id: 'product-2', name: 'Product 2' },
                { id: 'product-3', name: 'Product 3' }, // Add the missing product
            ];

            (getGroupByID as jest.Mock).mockResolvedValue(mockGroup);
            (getProductByIDs as jest.Mock).mockResolvedValue(mockProducts);
            (createProductGroupProducts as jest.Mock).mockResolvedValue(true);

            // Act
            await attachProductsToGroup(mockCall, mockCallback);

            // Assert
            expect(removeProductsByGroupID).not.toHaveBeenCalled(); // No existing products to remove
            expect(createProductGroupProducts).toHaveBeenCalledWith('group-123', ['product-1', 'product-2', 'product-3']);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products Attached successfully',
                status: status.OK,
            });
        });

        it('should handle single product attachment', async () => {
            // Arrange
            const mockCallSingleProduct = {
                ...mockCall,
                request: {
                    group_id: 'group-123',
                    product_ids: ['product-1'],
                },
            };

            const mockGroup = {
                id: 'group-123',
                ProductGroupProduct: [],
            };

            const mockProducts = [{ id: 'product-1', name: 'Product 1' }];

            (getGroupByID as jest.Mock).mockResolvedValue(mockGroup);
            (getProductByIDs as jest.Mock).mockResolvedValue(mockProducts);
            (createProductGroupProducts as jest.Mock).mockResolvedValue(true);

            // Act
            await attachProductsToGroup(mockCallSingleProduct, mockCallback);

            // Assert
            expect(getProductByIDs).toHaveBeenCalledWith(['product-1'], mockCallSingleProduct.metadata);
            expect(createProductGroupProducts).toHaveBeenCalledWith('group-123', ['product-1']);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Products Attached successfully',
                status: status.OK,
            });
        });
    });

    describe('Error scenarios', () => {
        it('should return NOT_FOUND when group does not exist', async () => {
            // Arrange
            (getGroupByID as jest.Mock).mockResolvedValue(null);

            // Act
            await attachProductsToGroup(mockCall, mockCallback);

            // Assert
            expect(getGroupByID).toHaveBeenCalledWith('group-123');
            expect(getProductByIDs).not.toHaveBeenCalled();
            expect(createProductGroupProducts).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should return NOT_FOUND when products array is null', async () => {
            // Arrange
            const mockGroup = {
                id: 'group-123',
                ProductGroupProduct: [],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockGroup);
            (getProductByIDs as jest.Mock).mockResolvedValue(null);

            // Act
            await attachProductsToGroup(mockCall, mockCallback);

            // Assert
            expect(getProductByIDs).toHaveBeenCalledWith(['product-1', 'product-2', 'product-3'], mockCall.metadata);
            expect(createProductGroupProducts).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should return NOT_FOUND when product count mismatch (some products not found)', async () => {
            // Arrange
            const mockGroup = {
                id: 'group-123',
                ProductGroupProduct: [],
            };

            const mockProducts = [
                { id: 'product-1', name: 'Product 1' },
                { id: 'product-2', name: 'Product 2' },
                // Missing product-3, so length mismatch: 2 vs 3
            ];

            (getGroupByID as jest.Mock).mockResolvedValue(mockGroup);
            (getProductByIDs as jest.Mock).mockResolvedValue(mockProducts);

            // Act
            await attachProductsToGroup(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should return INTERNAL error when getGroupByID throws an error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            (getGroupByID as jest.Mock).mockRejectedValue(mockError);

            // Act
            await attachProductsToGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should return INTERNAL error when getProductByIDs throws an error', async () => {
            // Arrange
            const mockGroup = { id: 'group-123', ProductGroupProduct: [] };
            const mockError = new Error('Product service unavailable');

            (getGroupByID as jest.Mock).mockResolvedValue(mockGroup);
            (getProductByIDs as jest.Mock).mockRejectedValue(mockError);

            // Act
            await attachProductsToGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should return INTERNAL error when removeProductsByGroupID throws an error', async () => {
            // Arrange
            const mockGroup = {
                id: 'group-123',
                ProductGroupProduct: [{ product_id: 'old-product-1' }],
            };
            const mockProducts = [{ id: 'product-1', name: 'Product 1' }];
            const mockError = new Error('Remove operation failed');

            (getGroupByID as jest.Mock).mockResolvedValue(mockGroup);
            (getProductByIDs as jest.Mock).mockResolvedValue(mockProducts);
            (removeProductsByGroupID as jest.Mock).mockRejectedValue(mockError);

            // Update the mockCall to use a single product to trigger the removal logic
            const mockCallSingleProduct = {
                ...mockCall,
                request: {
                    group_id: 'group-123',
                    product_ids: ['product-1'],
                },
            };

            // Act
            await attachProductsToGroup(mockCallSingleProduct, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should return INTERNAL error when createProductGroupProducts throws an error', async () => {
            // Arrange
            const mockGroup = {
                id: 'group-123',
                ProductGroupProduct: [],
            };
            const mockProducts = [
                { id: 'product-1', name: 'Product 1' },
                { id: 'product-2', name: 'Product 2' },
                { id: 'product-3', name: 'Product 3' },
            ];
            const mockError = new Error('Create operation failed');

            (getGroupByID as jest.Mock).mockResolvedValue(mockGroup);
            (getProductByIDs as jest.Mock).mockResolvedValue(mockProducts);
            (createProductGroupProducts as jest.Mock).mockRejectedValue(mockError);

            // Act
            await attachProductsToGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle utilFns.removeEmptyFields throwing an error', async () => {
            // Arrange
            const mockError = new Error('removeEmptyFields failed');
            (utilFns.removeEmptyFields as jest.Mock).mockImplementation(() => {
                throw mockError;
            });

            // Act
            await attachProductsToGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(getGroupByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });
    });

    describe('Product removal logic', () => {
        it('should identify and remove products that are no longer in the new list', async () => {
            // Arrange
            const mockGroup = {
                id: 'group-123',
                ProductGroupProduct: [
                    { product_id: 'product-1' }, // Keep this one
                    { product_id: 'product-2' }, // Keep this one  
                    { product_id: 'old-product-1' }, // Remove this one
                    { product_id: 'old-product-2' }, // Remove this one
                ],
            };

            const mockProducts = [
                { id: 'product-1', name: 'Product 1' },
                { id: 'product-2', name: 'Product 2' },
                { id: 'product-3', name: 'Product 3' }, // New product
            ];

            (getGroupByID as jest.Mock).mockResolvedValue(mockGroup);
            (getProductByIDs as jest.Mock).mockResolvedValue(mockProducts);
            (removeProductsByGroupID as jest.Mock).mockResolvedValue(true);
            (createProductGroupProducts as jest.Mock).mockResolvedValue(true);

            // Act
            await attachProductsToGroup(mockCall, mockCallback);

            // Assert
            expect(removeProductsByGroupID).toHaveBeenCalledWith('group-123', ['old-product-1', 'old-product-2']);
            expect(createProductGroupProducts).toHaveBeenCalledWith('group-123', ['product-1', 'product-2', 'product-3']);
        });

        it('should not call removeProductsByGroupID when no products need to be removed', async () => {
            // Arrange
            const mockGroup = {
                id: 'group-123',
                ProductGroupProduct: [
                    { product_id: 'product-1' }, // This stays
                ],
            };

            const mockProducts = [
                { id: 'product-1', name: 'Product 1' }, // Same as existing
                { id: 'product-2', name: 'Product 2' }, // New product
            ];

            const mockCallSubset = {
                ...mockCall,
                request: {
                    group_id: 'group-123',
                    product_ids: ['product-1', 'product-2'],
                },
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockGroup);
            (getProductByIDs as jest.Mock).mockResolvedValue(mockProducts);
            (createProductGroupProducts as jest.Mock).mockResolvedValue(true);

            // Act
            await attachProductsToGroup(mockCallSubset, mockCallback);

            // Assert
            expect(removeProductsByGroupID).not.toHaveBeenCalled();
            expect(createProductGroupProducts).toHaveBeenCalledWith('group-123', ['product-1', 'product-2']);
        });

        it('should handle complex product replacement scenario', async () => {
            // Arrange
            const mockGroup = {
                id: 'group-123',
                ProductGroupProduct: [
                    { product_id: 'A' },
                    { product_id: 'B' },
                    { product_id: 'C' },
                    { product_id: 'D' },
                ],
            };

            const mockProducts = [
                { id: 'B', name: 'Product B' }, // Keep
                { id: 'D', name: 'Product D' }, // Keep
                { id: 'E', name: 'Product E' }, // New
                { id: 'F', name: 'Product F' }, // New
            ];

            const mockCallComplex = {
                ...mockCall,
                request: {
                    group_id: 'group-123',
                    product_ids: ['B', 'D', 'E', 'F'],
                },
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockGroup);
            (getProductByIDs as jest.Mock).mockResolvedValue(mockProducts);
            (removeProductsByGroupID as jest.Mock).mockResolvedValue(true);
            (createProductGroupProducts as jest.Mock).mockResolvedValue(true);

            // Act
            await attachProductsToGroup(mockCallComplex, mockCallback);

            // Assert
            expect(removeProductsByGroupID).toHaveBeenCalledWith('group-123', ['A', 'C']); // Remove A and C
            expect(createProductGroupProducts).toHaveBeenCalledWith('group-123', ['B', 'D', 'E', 'F']);
        });
    });

    describe('Edge cases', () => {
        it('should handle empty product_ids array', async () => {
            // Arrange
            const mockCallEmpty = {
                ...mockCall,
                request: {
                    group_id: 'group-123',
                    product_ids: [],
                },
            };

            const mockGroup = {
                id: 'group-123',
                ProductGroupProduct: [{ product_id: 'existing-product' }],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockGroup);
            (getProductByIDs as jest.Mock).mockResolvedValue([]);

            // Act
            await attachProductsToGroup(mockCallEmpty, mockCallback);

            // Assert
            expect(getProductByIDs).toHaveBeenCalledWith([], mockCallEmpty.metadata);
            expect(removeProductsByGroupID).toHaveBeenCalledWith('group-123', ['existing-product']); // Remove all existing
            expect(createProductGroupProducts).toHaveBeenCalledWith('group-123', []);
        });

        it('should handle malformed group data (missing ProductGroupProduct)', async () => {
            // Arrange
            const mockGroup = {
                id: 'group-123',
                name: 'Test Group',
                // ProductGroupProduct is missing - this will cause group.ProductGroupProduct.map to throw
            };

            const mockProducts = [
                { id: 'product-1', name: 'Product 1' },
                { id: 'product-2', name: 'Product 2' },
                { id: 'product-3', name: 'Product 3' },
            ];

            (getGroupByID as jest.Mock).mockResolvedValue(mockGroup);
            (getProductByIDs as jest.Mock).mockResolvedValue(mockProducts);

            // Act
            await attachProductsToGroup(mockCall, mockCallback);

            // Assert - This should throw an error due to undefined ProductGroupProduct
            expect(logger.error).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle field cleaning that removes required fields', async () => {
            // Arrange
            const cleanedRequest = {
                // group_id removed by removeEmptyFields
                product_ids: ['product-1'],
            };

            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);
            (getGroupByID as jest.Mock).mockResolvedValue(null);

            // Act
            await attachProductsToGroup(mockCall, mockCallback);

            // Assert
            expect(getGroupByID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Not Found',
                status: status.NOT_FOUND,
            });
        });
    });

    describe('Service integration', () => {
        it('should verify correct service call sequence', async () => {
            // Arrange
            const mockGroup = {
                id: 'group-123',
                ProductGroupProduct: [{ product_id: 'old-product' }],
            };
            const mockProducts = [
                { id: 'product-1', name: 'Product 1' },
                { id: 'product-2', name: 'Product 2' },
                { id: 'product-3', name: 'Product 3' },
            ];

            // Create spies that track call order
            let callOrder = 0;
            const getGroupSpy = jest.fn().mockImplementation(async () => {
                getGroupSpy.callOrder = ++callOrder;
                return mockGroup;
            });
            const getProductsSpy = jest.fn().mockImplementation(async () => {
                getProductsSpy.callOrder = ++callOrder;
                return mockProducts;
            });
            const removeSpy = jest.fn().mockImplementation(async () => {
                removeSpy.callOrder = ++callOrder;
                return true;
            });
            const createSpy = jest.fn().mockImplementation(async () => {
                createSpy.callOrder = ++callOrder;
                return true;
            });

            (getGroupByID as jest.Mock).mockImplementation(getGroupSpy);
            (getProductByIDs as jest.Mock).mockImplementation(getProductsSpy);
            (removeProductsByGroupID as jest.Mock).mockImplementation(removeSpy);
            (createProductGroupProducts as jest.Mock).mockImplementation(createSpy);

            // Act
            await attachProductsToGroup(mockCall, mockCallback);

            // Assert - Verify call order using custom tracking
            expect(getGroupSpy.callOrder).toBeLessThan(getProductsSpy.callOrder);
            expect(getProductsSpy.callOrder).toBeLessThan(removeSpy.callOrder);
            expect(removeSpy.callOrder).toBeLessThan(createSpy.callOrder);
        });

        it('should pass metadata correctly to client service', async () => {
            // Arrange
            const mockGroup = { id: 'group-123', ProductGroupProduct: [] };
            const mockProducts = [{ id: 'product-1', name: 'Product 1' }];

            (getGroupByID as jest.Mock).mockResolvedValue(mockGroup);
            (getProductByIDs as jest.Mock).mockResolvedValue(mockProducts);
            (createProductGroupProducts as jest.Mock).mockResolvedValue(true);

            // Act
            await attachProductsToGroup(mockCall, mockCallback);

            // Assert
            expect(getProductByIDs).toHaveBeenCalledWith(
                expect.any(Array),
                mockCall.metadata
            );
        });
    });
});