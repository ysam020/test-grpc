import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetAttachedProductsRequest__Output,
    GetAttachedProductsResponse,
    GetAttachedProductsResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getGroupByID, getProductsByGroupID } from '../../../src/services/model.service';
import { getAttachedProducts } from '../../../src/handlers/getAttachedProducts';

// Mock dependencies
jest.mock('@atc/common');
jest.mock('@atc/logger');
jest.mock('../../../src/services/model.service');

describe('getAttachedProducts', () => {
    let mockCall: jest.Mocked<CustomServerUnaryCall<GetAttachedProductsRequest__Output, GetAttachedProductsResponse>>;
    let mockCallback: jest.MockedFunction<sendUnaryData<GetAttachedProductsResponse__Output>>;
    let mockGetGroupByID: jest.MockedFunction<typeof getGroupByID>;
    let mockGetProductsByGroupID: jest.MockedFunction<typeof getProductsByGroupID>;
    let mockUtilFns: jest.Mocked<typeof utilFns>;
    let mockLogger: jest.Mocked<typeof logger>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mocks
        mockGetGroupByID = getGroupByID as jest.MockedFunction<typeof getGroupByID>;
        mockGetProductsByGroupID = getProductsByGroupID as jest.MockedFunction<typeof getProductsByGroupID>;
        mockUtilFns = utilFns as jest.Mocked<typeof utilFns>;
        mockLogger = logger as jest.Mocked<typeof logger>;

        // Mock call object
        mockCall = {
            request: {
                group_id: 'test-group-id',
                page: 1,
                limit: 10,
            },
        } as any;

        // Mock callback
        mockCallback = jest.fn();

        // Default mock implementations
        mockUtilFns.removeEmptyFields = jest.fn().mockImplementation((obj) => obj);
    });

    describe('Success Cases', () => {
        it('should successfully return attached products', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'test-group-id',
                name: 'Test Group',
            };

            const mockProducts = [
                {
                    product_id: 'product-1',
                    MasterProduct: {
                        product_name: 'Test Product 1',
                        barcode: '123456789',
                        pack_size: '100ml',
                        rrp: '10.99',
                        Brand: {
                            id: 'brand-1',
                            brand_name: 'Test Brand 1',
                        },
                        Category: {
                            id: 'category-1',
                            category_name: 'Test Category 1',
                        },
                    },
                },
                {
                    product_id: 'product-2',
                    MasterProduct: {
                        product_name: 'Test Product 2',
                        barcode: '987654321',
                        pack_size: '200ml',
                        rrp: '15.99',
                        Brand: {
                            id: 'brand-2',
                            brand_name: 'Test Brand 2',
                        },
                        Category: {
                            id: 'category-2',
                            category_name: 'Test Category 2',
                        },
                    },
                },
            ];

            const mockTotalCount = 25;

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockGetProductsByGroupID.mockResolvedValue({
                products: mockProducts,
                totalCount: mockTotalCount,
            });

            // Act
            await getAttachedProducts(mockCall, mockCallback);

            // Assert
            expect(mockUtilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(mockGetGroupByID).toHaveBeenCalledWith('test-group-id');
            expect(mockGetProductsByGroupID).toHaveBeenCalledWith('test-group-id', 1, 10);
            
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.PRODUCT_GROUP.PRODUCTS_RETRIEVED,
                status: status.OK,
                data: {
                    group_id: 'test-group-id',
                    products: [
                        {
                            product_id: 'product-1',
                            product_name: 'Test Product 1',
                            barcode: '123456789',
                            pack_size: '100ml',
                            rrp: 10.99,
                            brand: {
                                id: 'brand-1',
                                name: 'Test Brand 1',
                            },
                            category: {
                                id: 'category-1',
                                name: 'Test Category 1',
                            },
                        },
                        {
                            product_id: 'product-2',
                            product_name: 'Test Product 2',
                            barcode: '987654321',
                            pack_size: '200ml',
                            rrp: 15.99,
                            brand: {
                                id: 'brand-2',
                                name: 'Test Brand 2',
                            },
                            category: {
                                id: 'category-2',
                                name: 'Test Category 2',
                            },
                        },
                    ],
                    total_count: 25,
                },
            });
        });

        it('should handle empty products array', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'test-group-id',
                name: 'Test Group',
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockGetProductsByGroupID.mockResolvedValue({
                products: [],
                totalCount: 0,
            });

            // Act
            await getAttachedProducts(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.PRODUCT_GROUP.PRODUCTS_RETRIEVED,
                status: status.OK,
                data: {
                    group_id: 'test-group-id',
                    products: [],
                    total_count: 0,
                },
            });
        });

        it('should properly clean request fields using utilFns.removeEmptyFields', async () => {
            // Arrange
            const requestWithEmptyFields = {
                group_id: 'test-group-id',
                page: 1,
                limit: 10,
                empty_field: '',
                null_field: null,
            };

            const cleanedRequest = {
                group_id: 'test-group-id',
                page: 1,
                limit: 10,
            };

            mockCall.request = requestWithEmptyFields as any;
            mockUtilFns.removeEmptyFields.mockReturnValue(cleanedRequest);
            
            const mockProductGroup = { id: 'test-group-id' };
            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockGetProductsByGroupID.mockResolvedValue({
                products: [],
                totalCount: 0,
            });

            // Act
            await getAttachedProducts(mockCall, mockCallback);

            // Assert
            expect(mockUtilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(mockGetGroupByID).toHaveBeenCalledWith('test-group-id');
            expect(mockGetProductsByGroupID).toHaveBeenCalledWith('test-group-id', 1, 10);
        });
    });

    describe('Error Cases', () => {
        it('should return NOT_FOUND when product group does not exist', async () => {
            // Arrange
            mockGetGroupByID.mockResolvedValue(null);

            // Act
            await getAttachedProducts(mockCall, mockCallback);

            // Assert
            expect(mockGetGroupByID).toHaveBeenCalledWith('test-group-id');
            expect(mockGetProductsByGroupID).not.toHaveBeenCalled();
            
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.PRODUCT_GROUP.NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        });

        it('should handle getGroupByID service error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            mockGetGroupByID.mockRejectedValue(mockError);

            // Act
            await getAttachedProducts(mockCall, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
                data: null,
            });
        });

        it('should handle getProductsByGroupID service error', async () => {
            // Arrange
            const mockProductGroup = { id: 'test-group-id' };
            const mockError = new Error('Products query failed');
            
            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockGetProductsByGroupID.mockRejectedValue(mockError);

            // Act
            await getAttachedProducts(mockCall, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
                data: null,
            });
        });

        it('should handle utilFns.removeEmptyFields error', async () => {
            // Arrange
            const mockError = new Error('Field removal failed');
            mockUtilFns.removeEmptyFields.mockImplementation(() => {
                throw mockError;
            });

            // Act
            await getAttachedProducts(mockCall, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
                data: null,
            });
        });

        it('should handle unexpected error during product mapping', async () => {
            // Arrange
            const mockProductGroup = { id: 'test-group-id' };
            const mockMalformedProduct = {
                product_id: 'product-1',
                MasterProduct: null, // This will cause error during mapping
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockGetProductsByGroupID.mockResolvedValue({
                products: [mockMalformedProduct],
                totalCount: 1,
            });

            // Act
            await getAttachedProducts(mockCall, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
                data: null,
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle string numbers for RRP conversion', async () => {
            // Arrange
            const mockProductGroup = { id: 'test-group-id' };
            const mockProduct = {
                product_id: 'product-1',
                MasterProduct: {
                    product_name: 'Test Product',
                    barcode: '123456789',
                    pack_size: '100ml',
                    rrp: '25.50', // String number
                    Brand: {
                        id: 'brand-1',
                        brand_name: 'Test Brand',
                    },
                    Category: {
                        id: 'category-1',
                        category_name: 'Test Category',
                    },
                },
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockGetProductsByGroupID.mockResolvedValue({
                products: [mockProduct],
                totalCount: 1,
            });

            // Act
            await getAttachedProducts(mockCall, mockCallback);

            // Assert
            const callArgs = mockCallback.mock.calls[0][1];
            expect(callArgs.data.products[0].rrp).toBe(25.5);
            expect(typeof callArgs.data.products[0].rrp).toBe('number');
        });

        it('should handle zero values for pagination', async () => {
            // Arrange
            mockCall.request = {
                group_id: 'test-group-id',
                page: 0,
                limit: 0,
            } as any;

            const mockProductGroup = { id: 'test-group-id' };
            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockGetProductsByGroupID.mockResolvedValue({
                products: [],
                totalCount: 0,
            });

            // Act
            await getAttachedProducts(mockCall, mockCallback);

            // Assert
            expect(mockGetProductsByGroupID).toHaveBeenCalledWith('test-group-id', 0, 0);
        });

        it('should handle missing optional fields in request', async () => {
            // Arrange
            mockCall.request = {
                group_id: 'test-group-id',
                // page and limit are missing
            } as any;

            const cleanedRequest = {
                group_id: 'test-group-id',
            };

            mockUtilFns.removeEmptyFields.mockReturnValue(cleanedRequest);

            const mockProductGroup = { id: 'test-group-id' };
            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockGetProductsByGroupID.mockResolvedValue({
                products: [],
                totalCount: 0,
            });

            // Act
            await getAttachedProducts(mockCall, mockCallback);

            // Assert
            expect(mockGetProductsByGroupID).toHaveBeenCalledWith(
                'test-group-id',
                undefined,
                undefined
            );
        });
    });

    describe('Data Transformation', () => {
        it('should correctly transform product data structure', async () => {
            // Arrange
            const mockProductGroup = { id: 'test-group-id' };
            const mockProduct = {
                product_id: 'product-1',
                MasterProduct: {
                    product_name: 'Test Product',
                    barcode: '123456789',
                    pack_size: '100ml',
                    rrp: '10.99',
                    Brand: {
                        id: 'brand-1',
                        brand_name: 'Test Brand',
                    },
                    Category: {
                        id: 'category-1',
                        category_name: 'Test Category',
                    },
                },
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockGetProductsByGroupID.mockResolvedValue({
                products: [mockProduct],
                totalCount: 1,
            });

            // Act
            await getAttachedProducts(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const transformedProduct = response.data.products[0];

            expect(transformedProduct).toEqual({
                product_id: 'product-1',
                product_name: 'Test Product',
                barcode: '123456789',
                pack_size: '100ml',
                rrp: 10.99,
                brand: {
                    id: 'brand-1',
                    name: 'Test Brand',
                },
                category: {
                    id: 'category-1',
                    name: 'Test Category',
                },
            });
        });

        it('should maintain original group_id in response', async () => {
            // Arrange
            const originalGroupId = 'original-group-id';
            const mockProductGroup = { id: originalGroupId };

            mockCall.request.group_id = originalGroupId;
            mockGetGroupByID.mockResolvedValue(mockProductGroup);
            mockGetProductsByGroupID.mockResolvedValue({
                products: [],
                totalCount: 0,
            });

            // Act
            await getAttachedProducts(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            expect(response.data.group_id).toBe(originalGroupId);
        });
    });
});