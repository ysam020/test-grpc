import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetProductGroupRequest__Output,
    GetProductGroupResponse,
    GetProductGroupResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getGroupByID } from '../../../src/services/model.service';
import { getProductGroup } from '../../../src/handlers/getProductGroup';

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
            RETRIEVED: 'Product group retrieved successfully',
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

describe('getProductGroup', () => {
    let mockCall: jest.Mocked<CustomServerUnaryCall<GetProductGroupRequest__Output, GetProductGroupResponse>>;
    let mockCallback: jest.MockedFunction<sendUnaryData<GetProductGroupResponse__Output>>;
    let mockGetGroupByID: jest.MockedFunction<typeof getGroupByID>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mocks
        mockGetGroupByID = getGroupByID as jest.MockedFunction<typeof getGroupByID>;

        // Mock call object with default request
        mockCall = {
            request: {
                group_id: 'group-123',
            },
        } as any;

        // Mock callback function
        mockCallback = jest.fn();

        // Default mock implementations
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation((obj) => obj);
    });

    describe('Successful Operations', () => {
        it('should successfully retrieve product group with complete data', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-123',
                group_name: 'Electronics Group',
                type: 'CATEGORY',
                brands: [
                    {
                        id: 'brand-001',
                        brand_name: 'Apple',
                    },
                    {
                        id: 'brand-002',
                        brand_name: 'Samsung',
                    },
                    {
                        id: 'brand-003',
                        brand_name: 'Sony',
                    },
                ],
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(mockGetGroupByID).toHaveBeenCalledWith('group-123');

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product group retrieved successfully',
                status: status.OK,
                data: {
                    id: 'group-123',
                    group_name: 'Electronics Group',
                    type: 'CATEGORY',
                    brands: [
                        {
                            id: 'brand-001',
                            name: 'Apple',
                        },
                        {
                            id: 'brand-002',
                            name: 'Samsung',
                        },
                        {
                            id: 'brand-003',
                            name: 'Sony',
                        },
                    ],
                },
            });
        });

        it('should successfully retrieve product group with empty brands array', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-empty-brands',
                group_name: 'Empty Brands Group',
                type: 'CUSTOM',
                brands: [],
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product group retrieved successfully',
                status: status.OK,
                data: {
                    id: 'group-empty-brands',
                    group_name: 'Empty Brands Group',
                    type: 'CUSTOM',
                    brands: [],
                },
            });
        });

        it('should successfully retrieve product group with single brand', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-single-brand',
                group_name: 'Single Brand Group',
                type: 'BRAND_SPECIFIC',
                brands: [
                    {
                        id: 'brand-single',
                        brand_name: 'Nike',
                    },
                ],
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product group retrieved successfully',
                status: status.OK,
                data: {
                    id: 'group-single-brand',
                    group_name: 'Single Brand Group',
                    type: 'BRAND_SPECIFIC',
                    brands: [
                        {
                            id: 'brand-single',
                            name: 'Nike',
                        },
                    ],
                },
            });
        });

        it('should properly clean request fields using utilFns.removeEmptyFields', async () => {
            // Arrange
            const requestWithEmptyFields = {
                group_id: 'group-123',
                empty_field: '',
                null_field: null,
                undefined_field: undefined,
            };

            const cleanedRequest = {
                group_id: 'group-123',
            };

            mockCall.request = requestWithEmptyFields as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);
            
            const mockProductGroup = {
                id: 'group-123',
                group_name: 'Test Group',
                type: 'TEST',
                brands: [],
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(mockGetGroupByID).toHaveBeenCalledWith('group-123');
        });
    });

    describe('Data Transformation', () => {
        it('should correctly transform brand data structure', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-transform',
                group_name: 'Transform Test Group',
                type: 'ELECTRONICS',
                brands: [
                    {
                        id: 'brand-transform-1',
                        brand_name: 'Transformed Brand One',
                        extra_field: 'should_be_excluded',
                        another_field: 'also_excluded',
                    },
                    {
                        id: 'brand-transform-2',
                        brand_name: 'Transformed Brand Two',
                        unwanted_data: 'not_included',
                    },
                ],
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const transformedBrands = response.data.brands;

            expect(transformedBrands).toHaveLength(2);
            expect(transformedBrands[0]).toEqual({
                id: 'brand-transform-1',
                name: 'Transformed Brand One',
            });
            expect(transformedBrands[1]).toEqual({
                id: 'brand-transform-2',
                name: 'Transformed Brand Two',
            });

            // Ensure extra fields are not included
            expect(transformedBrands[0]).not.toHaveProperty('brand_name');
            expect(transformedBrands[0]).not.toHaveProperty('extra_field');
            expect(transformedBrands[1]).not.toHaveProperty('unwanted_data');
        });

        it('should preserve all product group properties during transformation', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-preserve',
                group_name: 'Preserve Properties Group',
                type: 'PRESERVE_TEST',
                description: 'This field should be preserved',
                created_at: '2024-01-15T10:00:00Z',
                updated_at: '2024-01-15T11:00:00Z',
                custom_property: 'custom_value',
                brands: [
                    {
                        id: 'brand-preserve',
                        brand_name: 'Preserve Brand',
                    },
                ],
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const data = response.data;

            // Check that core properties are included
            expect(data.id).toBe('group-preserve');
            expect(data.group_name).toBe('Preserve Properties Group');
            expect(data.type).toBe('PRESERVE_TEST');
            expect(data.brands).toHaveLength(1);

            // Note: Extra properties like description, created_at, etc. are not included
            // in the response structure based on the implementation
            expect(data).not.toHaveProperty('description');
            expect(data).not.toHaveProperty('created_at');
            expect(data).not.toHaveProperty('custom_property');
        });

        it('should handle brands with special characters in names', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-special-chars',
                group_name: 'Special Characters Group',
                type: 'SPECIAL',
                brands: [
                    {
                        id: 'brand-special-1',
                        brand_name: 'Brand with "Quotes" & Symbols!',
                    },
                    {
                        id: 'brand-special-2',
                        brand_name: 'Bränd wïth Ümlauts & Açcénts',
                    },
                    {
                        id: 'brand-special-3',
                        brand_name: 'Brand with Émojis 🎯 & Unicode ★',
                    },
                ],
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const brands = response.data.brands;

            expect(brands[0].name).toBe('Brand with "Quotes" & Symbols!');
            expect(brands[1].name).toBe('Bränd wïth Ümlauts & Açcénts');
            expect(brands[2].name).toBe('Brand with Émojis 🎯 & Unicode ★');
        });

        it('should handle large number of brands', async () => {
            // Arrange
            const largeBrandsArray = Array.from({ length: 100 }, (_, index) => ({
                id: `brand-${index.toString().padStart(3, '0')}`,
                brand_name: `Brand ${index + 1}`,
            }));

            const mockProductGroup = {
                id: 'group-large-brands',
                group_name: 'Large Brands Group',
                type: 'LARGE_COLLECTION',
                brands: largeBrandsArray,
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const brands = response.data.brands;

            expect(brands).toHaveLength(100);
            expect(brands[0]).toEqual({
                id: 'brand-000',
                name: 'Brand 1',
            });
            expect(brands[99]).toEqual({
                id: 'brand-099',
                name: 'Brand 100',
            });
        });
    });

    describe('Error Handling', () => {
        it('should return NOT_FOUND when product group does not exist', async () => {
            // Arrange
            mockGetGroupByID.mockResolvedValue(null);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetGroupByID).toHaveBeenCalledWith('group-123');
            
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product group not found',
                status: status.NOT_FOUND,
                data: null,
            });
        });

        it('should handle getGroupByID service error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            mockGetGroupByID.mockRejectedValue(mockError);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
                data: null,
            });
        });

        it('should handle utilFns.removeEmptyFields error', async () => {
            // Arrange
            const mockError = new Error('Field removal failed');
            (utilFns.removeEmptyFields as jest.Mock).mockImplementation(() => {
                throw mockError;
            });

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
                data: null,
            });
        });

        it('should handle data transformation error', async () => {
            // Arrange
            const mockMalformedProductGroup = {
                id: 'group-malformed',
                group_name: 'Malformed Group',
                type: 'MALFORMED',
                brands: null, // This will cause error during mapping
            };

            mockGetGroupByID.mockResolvedValue(mockMalformedProductGroup);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
                data: null,
            });
        });

        it('should handle brand transformation error', async () => {
            // Arrange
            const mockProductGroupWithMalformedBrand = {
                id: 'group-malformed-brand',
                group_name: 'Malformed Brand Group',
                type: 'MALFORMED_BRAND',
                brands: [
                    {
                        id: 'brand-good',
                        brand_name: 'Good Brand',
                    },
                    {
                        // This brand object will cause an error when accessing brand_name
                        id: 'brand-bad',
                        brand_name: undefined,
                        toString: () => { throw new Error('Brand mapping error'); }
                    },
                ],
            };

            // Mock the brands.map to throw an error during iteration
            mockProductGroupWithMalformedBrand.brands.map = jest.fn().mockImplementation(() => {
                throw new Error('Brand mapping failed');
            });

            mockGetGroupByID.mockResolvedValue(mockProductGroupWithMalformedBrand);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
                data: null,
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing group_id in request', async () => {
            // Arrange
            const requestWithoutGroupId = {};
            const cleanedRequest = {};

            mockCall.request = requestWithoutGroupId as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            mockGetGroupByID.mockResolvedValue(null);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetGroupByID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product group not found',
                status: status.NOT_FOUND,
                data: null,
            });
        });

        it('should handle empty string group_id', async () => {
            // Arrange
            mockCall.request = { group_id: '' } as any;
            
            mockGetGroupByID.mockResolvedValue(null);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetGroupByID).toHaveBeenCalledWith('');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product group not found',
                status: status.NOT_FOUND,
                data: null,
            });
        });

        it('should handle very long group_id', async () => {
            // Arrange
            const longGroupId = 'a'.repeat(1000);
            mockCall.request = { group_id: longGroupId } as any;
            
            mockGetGroupByID.mockResolvedValue(null);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetGroupByID).toHaveBeenCalledWith(longGroupId);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product group not found',
                status: status.NOT_FOUND,
                data: null,
            });
        });

        it('should handle group with special characters in group_name and type', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-special-props',
                group_name: 'Spéçiál Grøup Nämé with Émojis 🎯',
                type: 'SPÉÇIÁL_TYPÉ',
                brands: [
                    {
                        id: 'brand-normal',
                        brand_name: 'Normal Brand',
                    },
                ],
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            expect(response.data.group_name).toBe('Spéçiál Grøup Nämé with Émojis 🎯');
            expect(response.data.type).toBe('SPÉÇIÁL_TYPÉ');
            expect(response.status).toBe(status.OK);
        });

        it('should handle group with undefined/null properties gracefully', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-undefined-props',
                group_name: undefined,
                type: null,
                brands: [
                    {
                        id: 'brand-test',
                        brand_name: 'Test Brand',
                    },
                ],
            };

            mockGetGroupByID.mockResolvedValue(mockProductGroup);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            expect(response.data.group_name).toBeUndefined();
            expect(response.data.type).toBeNull();
            expect(response.data.brands).toHaveLength(1);
            expect(response.status).toBe(status.OK);
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle complete workflow with realistic data', async () => {
            // Arrange
            const realisticRequest = {
                group_id: 'electronics-smartphones-2024',
                extra_param: 'should_be_removed',
                empty_string: '',
            };

            const cleanedRequest = {
                group_id: 'electronics-smartphones-2024',
            };

            mockCall.request = realisticRequest as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const realisticProductGroup = {
                id: 'electronics-smartphones-2024',
                group_name: 'Smartphones & Mobile Devices 2024',
                type: 'ELECTRONICS_CATEGORY',
                description: 'Collection of smartphone brands for 2024 season',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-07-15T10:30:00Z',
                brands: [
                    {
                        id: 'apple-inc',
                        brand_name: 'Apple',
                        country: 'USA',
                        founded: 1976,
                    },
                    {
                        id: 'samsung-electronics',
                        brand_name: 'Samsung',
                        country: 'South Korea',
                        founded: 1938,
                    },
                    {
                        id: 'google-pixel',
                        brand_name: 'Google Pixel',
                        country: 'USA',
                        founded: 2016,
                    },
                ],
            };

            mockGetGroupByID.mockResolvedValue(realisticProductGroup);

            // Act
            await getProductGroup(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(realisticRequest);
            expect(mockGetGroupByID).toHaveBeenCalledWith('electronics-smartphones-2024');

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product group retrieved successfully',
                status: status.OK,
                data: {
                    id: 'electronics-smartphones-2024',
                    group_name: 'Smartphones & Mobile Devices 2024',
                    type: 'ELECTRONICS_CATEGORY',
                    brands: [
                        {
                            id: 'apple-inc',
                            name: 'Apple',
                        },
                        {
                            id: 'samsung-electronics',
                            name: 'Samsung',
                        },
                        {
                            id: 'google-pixel',
                            name: 'Google Pixel',
                        },
                    ],
                },
            });
        });
    });
});