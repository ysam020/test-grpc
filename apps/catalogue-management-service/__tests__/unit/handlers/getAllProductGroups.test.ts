import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import {
    GetAllProductGroupsRequest__Output,
    GetAllProductGroupsResponse,
    GetAllProductGroupsResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { logger } from '@atc/logger';
import { getAllGroups } from '../../../src/services/model.service';
import { getAllProductGroups } from '../../../src/handlers/getAllProductGroups';

// Mock all dependencies
jest.mock('@atc/common');
jest.mock('@atc/logger');
jest.mock('../../../src/services/model.service');

describe('getAllProductGroups', () => {
    let mockCall: jest.Mocked<CustomServerUnaryCall<GetAllProductGroupsRequest__Output, GetAllProductGroupsResponse>>;
    let mockCallback: jest.MockedFunction<sendUnaryData<GetAllProductGroupsResponse__Output>>;
    let mockGetAllGroups: jest.MockedFunction<typeof getAllGroups>;
    let mockUtilFns: jest.Mocked<typeof utilFns>;
    let mockLogger: jest.Mocked<typeof logger>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mocks
        mockGetAllGroups = getAllGroups as jest.MockedFunction<typeof getAllGroups>;
        mockUtilFns = utilFns as jest.Mocked<typeof utilFns>;
        mockLogger = logger as jest.Mocked<typeof logger>;

        // Mock call object with default request
        mockCall = {
            request: {
                keyword: 'electronics',
                brand_id: 'brand-123',
                page: 1,
                limit: 10,
            },
        } as any;

        // Mock callback function
        mockCallback = jest.fn();

        // Default mock implementations
        mockUtilFns.removeEmptyFields = jest.fn().mockImplementation((obj) => obj);
    });

    describe('Successful Operations', () => {
        it('should successfully retrieve all product groups with complete data', async () => {
            // Arrange
            const mockGroups = [
                {
                    id: 'group-001',
                    name: 'Electronics Group',
                    description: 'Consumer electronics products',
                    created_at: '2024-01-15T10:00:00Z',
                    updated_at: '2024-01-15T10:00:00Z',
                    brands: [
                        {
                            id: 'brand-apple',
                            brand_name: 'Apple',
                        },
                        {
                            id: 'brand-samsung',
                            brand_name: 'Samsung',
                        },
                    ],
                    _count: {
                        ProductGroupProduct: 25,
                    },
                },
                {
                    id: 'group-002',
                    name: 'Home Appliances',
                    description: 'Kitchen and home appliances',
                    created_at: '2024-01-16T09:30:00Z',
                    updated_at: '2024-01-16T09:30:00Z',
                    brands: [
                        {
                            id: 'brand-lg',
                            brand_name: 'LG',
                        },
                        {
                            id: 'brand-whirlpool',
                            brand_name: 'Whirlpool',
                        },
                    ],
                    _count: {
                        ProductGroupProduct: 18,
                    },
                },
            ];

            const mockTotalCount = 50;

            mockGetAllGroups.mockResolvedValue({
                groups: mockGroups,
                totalCount: mockTotalCount,
            });

            // Act
            await getAllProductGroups(mockCall, mockCallback);

            // Assert
            expect(mockUtilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(mockGetAllGroups).toHaveBeenCalledWith(1, 10, 'electronics', 'brand-123');
            
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.PRODUCT_GROUP.RETRIEVED,
                status: status.OK,
                data: {
                    product_groups: [
                        {
                            id: 'group-001',
                            name: 'Electronics Group',
                            description: 'Consumer electronics products',
                            created_at: '2024-01-15T10:00:00Z',
                            updated_at: '2024-01-15T10:00:00Z',
                            brands: [
                                {
                                    id: 'brand-apple',
                                    name: 'Apple',
                                },
                                {
                                    id: 'brand-samsung',
                                    name: 'Samsung',
                                },
                            ],
                            _count: {
                                ProductGroupProduct: 25,
                            },
                            no_of_products: 25,
                        },
                        {
                            id: 'group-002',
                            name: 'Home Appliances',
                            description: 'Kitchen and home appliances',
                            created_at: '2024-01-16T09:30:00Z',
                            updated_at: '2024-01-16T09:30:00Z',
                            brands: [
                                {
                                    id: 'brand-lg',
                                    name: 'LG',
                                },
                                {
                                    id: 'brand-whirlpool',
                                    name: 'Whirlpool',
                                },
                            ],
                            _count: {
                                ProductGroupProduct: 18,
                            },
                            no_of_products: 18,
                        },
                    ],
                    total_count: 50,
                },
            });
        });

        it('should successfully handle empty product groups list', async () => {
            // Arrange
            mockGetAllGroups.mockResolvedValue({
                groups: [],
                totalCount: 0,
            });

            // Act
            await getAllProductGroups(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.PRODUCT_GROUP.RETRIEVED,
                status: status.OK,
                data: {
                    product_groups: [],
                    total_count: 0,
                },
            });
        });

        it('should handle groups with empty brands array', async () => {
            // Arrange
            const mockGroups = [
                {
                    id: 'group-003',
                    name: 'New Group',
                    description: 'Group without brands',
                    created_at: '2024-01-17T11:00:00Z',
                    updated_at: '2024-01-17T11:00:00Z',
                    brands: [],
                    _count: {
                        ProductGroupProduct: 0,
                    },
                },
            ];

            mockGetAllGroups.mockResolvedValue({
                groups: mockGroups,
                totalCount: 1,
            });

            // Act
            await getAllProductGroups(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const transformedGroup = response.data.product_groups[0];

            expect(transformedGroup.brands).toEqual([]);
            expect(transformedGroup.no_of_products).toBe(0);
            expect(transformedGroup._count.ProductGroupProduct).toBe(0);
        });

        it('should properly clean request fields using utilFns.removeEmptyFields', async () => {
            // Arrange
            const requestWithEmptyFields = {
                keyword: 'electronics',
                brand_id: 'brand-123',
                page: 1,
                limit: 10,
                empty_field: '',
                null_field: null,
                undefined_field: undefined,
            };

            const cleanedRequest = {
                keyword: 'electronics',
                brand_id: 'brand-123',
                page: 1,
                limit: 10,
            };

            mockCall.request = requestWithEmptyFields as any;
            mockUtilFns.removeEmptyFields.mockReturnValue(cleanedRequest);
            
            mockGetAllGroups.mockResolvedValue({
                groups: [],
                totalCount: 0,
            });

            // Act
            await getAllProductGroups(mockCall, mockCallback);

            // Assert
            expect(mockUtilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(mockGetAllGroups).toHaveBeenCalledWith(1, 10, 'electronics', 'brand-123');
        });
    });

    describe('Parameter Handling', () => {
        it('should handle request with only keyword filter', async () => {
            // Arrange
            const requestWithKeywordOnly = {
                keyword: 'home',
                page: 1,
                limit: 5,
            };

            mockCall.request = requestWithKeywordOnly as any;
            mockUtilFns.removeEmptyFields.mockReturnValue(requestWithKeywordOnly);
            
            mockGetAllGroups.mockResolvedValue({
                groups: [],
                totalCount: 0,
            });

            // Act
            await getAllProductGroups(mockCall, mockCallback);

            // Assert
            expect(mockGetAllGroups).toHaveBeenCalledWith(1, 5, 'home', undefined);
        });

        it('should handle request with only brand_id filter', async () => {
            // Arrange
            const requestWithBrandOnly = {
                brand_id: 'brand-sony',
                page: 2,
                limit: 20,
            };

            mockCall.request = requestWithBrandOnly as any;
            mockUtilFns.removeEmptyFields.mockReturnValue(requestWithBrandOnly);
            
            mockGetAllGroups.mockResolvedValue({
                groups: [],
                totalCount: 0,
            });

            // Act
            await getAllProductGroups(mockCall, mockCallback);

            // Assert
            expect(mockGetAllGroups).toHaveBeenCalledWith(2, 20, undefined, 'brand-sony');
        });

        it('should handle request with minimal parameters', async () => {
            // Arrange
            const minimalRequest = {
                page: 1,
                limit: 10,
            };

            mockCall.request = minimalRequest as any;
            mockUtilFns.removeEmptyFields.mockReturnValue(minimalRequest);
            
            mockGetAllGroups.mockResolvedValue({
                groups: [],
                totalCount: 0,
            });

            // Act
            await getAllProductGroups(mockCall, mockCallback);

            // Assert
            expect(mockGetAllGroups).toHaveBeenCalledWith(1, 10, undefined, undefined);
        });

        it('should handle zero values for pagination', async () => {
            // Arrange
            const requestWithZeroValues = {
                page: 0,
                limit: 0,
                keyword: 'test',
            };

            mockCall.request = requestWithZeroValues as any;
            mockUtilFns.removeEmptyFields.mockReturnValue(requestWithZeroValues);
            
            mockGetAllGroups.mockResolvedValue({
                groups: [],
                totalCount: 0,
            });

            // Act
            await getAllProductGroups(mockCall, mockCallback);

            // Assert
            expect(mockGetAllGroups).toHaveBeenCalledWith(0, 0, 'test', undefined);
        });
    });

    describe('Data Transformation', () => {
        it('should correctly transform brand data structure', async () => {
            // Arrange
            const mockGroups = [
                {
                    id: 'group-001',
                    name: 'Test Group',
                    brands: [
                        {
                            id: 'brand-001',
                            brand_name: 'Original Brand Name',
                            other_field: 'should_be_excluded',
                        },
                    ],
                    _count: {
                        ProductGroupProduct: 5,
                    },
                },
            ];

            mockGetAllGroups.mockResolvedValue({
                groups: mockGroups,
                totalCount: 1,
            });

            // Act
            await getAllProductGroups(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const transformedGroup = response.data.product_groups[0];

            expect(transformedGroup.brands[0]).toEqual({
                id: 'brand-001',
                name: 'Original Brand Name',
            });
            expect(transformedGroup.brands[0]).not.toHaveProperty('brand_name');
            expect(transformedGroup.brands[0]).not.toHaveProperty('other_field');
            expect(transformedGroup.no_of_products).toBe(5);
            expect(transformedGroup._count.ProductGroupProduct).toBe(5);
        });

        it('should correctly map product count and preserve _count object', async () => {
            // Arrange
            const mockGroups = [
                {
                    id: 'group-001',
                    name: 'Test Group',
                    brands: [],
                    _count: {
                        ProductGroupProduct: 42,
                        OtherCount: 10, // Should be ignored
                    },
                },
            ];

            mockGetAllGroups.mockResolvedValue({
                groups: mockGroups,
                totalCount: 1,
            });

            // Act
            await getAllProductGroups(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const transformedGroup = response.data.product_groups[0];

            expect(transformedGroup.no_of_products).toBe(42);
            expect(transformedGroup._count.ProductGroupProduct).toBe(42);
            expect(transformedGroup._count.OtherCount).toBe(10);
        });

        it('should preserve all group properties including _count during transformation', async () => {
            // Arrange
            const mockGroups = [
                {
                    id: 'group-001',
                    name: 'Test Group',
                    description: 'Test Description',
                    created_at: '2024-01-15T10:00:00Z',
                    updated_at: '2024-01-15T11:00:00Z',
                    custom_field: 'custom_value',
                    brands: [],
                    _count: {
                        ProductGroupProduct: 10,
                    },
                },
            ];

            mockGetAllGroups.mockResolvedValue({
                groups: mockGroups,
                totalCount: 1,
            });

            // Act
            await getAllProductGroups(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const transformedGroup = response.data.product_groups[0];

            expect(transformedGroup).toEqual({
                id: 'group-001',
                name: 'Test Group',
                description: 'Test Description',
                created_at: '2024-01-15T10:00:00Z',
                updated_at: '2024-01-15T11:00:00Z',
                custom_field: 'custom_value',
                brands: [],
                _count: {
                    ProductGroupProduct: 10,
                },
                no_of_products: 10,
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle getAllGroups service error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            mockGetAllGroups.mockRejectedValue(mockError);

            // Act
            await getAllProductGroups(mockCall, mockCallback);

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
            await getAllProductGroups(mockCall, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
                data: null,
            });
        });

        it('should handle data transformation error', async () => {
            // Arrange
            const mockMalformedGroups = [
                {
                    id: 'group-001',
                    name: 'Test Group',
                    brands: null, // This will cause error during mapping
                    _count: {
                        ProductGroupProduct: 5,
                    },
                },
            ];

            mockGetAllGroups.mockResolvedValue({
                groups: mockMalformedGroups,
                totalCount: 1,
            });

            // Act
            await getAllProductGroups(mockCall, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
                data: null,
            });
        });

        it('should handle missing _count property', async () => {
            // Arrange
            const mockGroupsWithoutCount = [
                {
                    id: 'group-001',
                    name: 'Test Group',
                    brands: [],
                    // _count property is missing
                },
            ];

            mockGetAllGroups.mockResolvedValue({
                groups: mockGroupsWithoutCount,
                totalCount: 1,
            });

            // Act
            await getAllProductGroups(mockCall, mockCallback);

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
        it('should handle groups with multiple brands correctly', async () => {
            // Arrange
            const mockGroups = [
                {
                    id: 'group-001',
                    name: 'Multi-Brand Group',
                    brands: [
                        { id: 'brand-1', brand_name: 'Brand One' },
                        { id: 'brand-2', brand_name: 'Brand Two' },
                        { id: 'brand-3', brand_name: 'Brand Three' },
                        { id: 'brand-4', brand_name: 'Brand Four' },
                        { id: 'brand-5', brand_name: 'Brand Five' },
                    ],
                    _count: {
                        ProductGroupProduct: 100,
                    },
                },
            ];

            mockGetAllGroups.mockResolvedValue({
                groups: mockGroups,
                totalCount: 1,
            });

            // Act
            await getAllProductGroups(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const transformedGroup = response.data.product_groups[0];

            expect(transformedGroup.brands).toHaveLength(5);
            expect(transformedGroup.brands[0]).toEqual({ id: 'brand-1', name: 'Brand One' });
            expect(transformedGroup.brands[4]).toEqual({ id: 'brand-5', name: 'Brand Five' });
        });

        it('should handle large product counts', async () => {
            // Arrange
            const mockGroups = [
                {
                    id: 'group-001',
                    name: 'Large Group',
                    brands: [],
                    _count: {
                        ProductGroupProduct: 999999,
                    },
                },
            ];

            mockGetAllGroups.mockResolvedValue({
                groups: mockGroups,
                totalCount: 1,
            });

            // Act
            await getAllProductGroups(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            expect(response.data.product_groups[0].no_of_products).toBe(999999);
        });

        it('should handle groups with special characters in names', async () => {
            // Arrange
            const mockGroups = [
                {
                    id: 'group-001',
                    name: 'Group with "Special" Characters & Symbols!',
                    description: 'Description with émojis 🎉 and unicode',
                    brands: [
                        {
                            id: 'brand-1',
                            brand_name: 'Brand with Ümlauts & Açcénts',
                        },
                    ],
                    _count: {
                        ProductGroupProduct: 5,
                    },
                },
            ];

            mockGetAllGroups.mockResolvedValue({
                groups: mockGroups,
                totalCount: 1,
            });

            // Act
            await getAllProductGroups(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const transformedGroup = response.data.product_groups[0];

            expect(transformedGroup.name).toBe('Group with "Special" Characters & Symbols!');
            expect(transformedGroup.description).toBe('Description with émojis 🎉 and unicode');
            expect(transformedGroup.brands[0].name).toBe('Brand with Ümlauts & Açcénts');
        });
    });
});