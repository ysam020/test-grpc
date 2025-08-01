import {
    AdItemMatchType,
    errorMessage,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetSingleAdvertisementRequest__Output,
    GetSingleAdvertisementResponse,
    GetSingleAdvertisementResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getDetailedAdvertisementByID } from '../../../src/services/model.service';
import { getSingleAdvertisement } from '../../../src/handlers/getSingleAdvertisement';

// Mock all dependencies following the project pattern
jest.mock('@atc/common', () => ({
    AdItemMatchType: {
        MATCHED: 'MATCHED',
        NOT_MATCHED: 'NOT_MATCHED',
        IN_PROGRESS: 'IN_PROGRESS',
    },
    errorMessage: {
        ADVERTISEMENT: {
            NOT_FOUND: 'Advertisement not found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        ADVERTISEMENT: {
            RETRIEVED: 'Advertisement retrieved successfully',
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

describe('getSingleAdvertisement', () => {
    let mockCall: jest.Mocked<CustomServerUnaryCall<GetSingleAdvertisementRequest__Output, GetSingleAdvertisementResponse>>;
    let mockCallback: jest.MockedFunction<sendUnaryData<GetSingleAdvertisementResponse__Output>>;
    let mockGetDetailedAdvertisementByID: jest.MockedFunction<typeof getDetailedAdvertisementByID>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mocks
        mockGetDetailedAdvertisementByID = getDetailedAdvertisementByID as jest.MockedFunction<typeof getDetailedAdvertisementByID>;

        // Mock call object with default request
        mockCall = {
            request: {
                advertisement_id: 'ad-123',
                page: 1,
            },
        } as any;

        // Mock callback function
        mockCallback = jest.fn();

        // Default mock implementations
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation((obj) => obj);
    });

    describe('Successful Operations', () => {
        it('should successfully retrieve single advertisement with complete data', async () => {
            // Arrange
            const mockMappedAdvertisement = {
                id: 'ad-123',
                title: 'Summer Sale 2024',
                description: 'Great deals on summer products',
                advertisement_type: 'BANNER',
                start_date: '2024-06-01T00:00:00.000Z',
                end_date: '2024-08-31T23:59:59.000Z',
                status: 'ACTIVE',
                retailer: {
                    id: 'retailer-456',
                    name: 'Summer Store',
                    logo: 'https://example.com/logo.png',
                },
                images: [
                    {
                        id: 'img-001',
                        url: 'https://example.com/ad-image-1.jpg',
                        alt_text: 'Summer sale banner',
                    },
                    {
                        id: 'img-002',
                        url: 'https://example.com/ad-image-2.jpg',
                        alt_text: 'Product showcase',
                    },
                ],
                products: [
                    {
                        id: 'prod-001',
                        name: 'Summer T-Shirt',
                        price: 29.99,
                        match_type: 'MATCHED',
                        confidence_score: 0.95,
                    },
                    {
                        id: 'prod-002',
                        name: 'Beach Shorts',
                        price: 39.99,
                        match_type: 'IN_PROGRESS',
                        confidence_score: 0.75,
                    },
                ],
                analytics: {
                    views: 15420,
                    clicks: 1234,
                    conversions: 89,
                    ctr: 0.08,
                },
                created_at: '2024-05-15T10:00:00.000Z',
                updated_at: '2024-06-01T09:30:00.000Z',
            };

            const mockResult = {
                mappedAdvertisement: mockMappedAdvertisement,
                totalProducts: 2,
                currentPage: 1,
            };

            mockGetDetailedAdvertisementByID.mockResolvedValue(mockResult);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(mockGetDetailedAdvertisementByID).toHaveBeenCalledWith('ad-123', 1);

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement retrieved successfully',
                status: status.OK,
                data: mockMappedAdvertisement,
            });
        });

        it('should successfully retrieve advertisement with minimal data', async () => {
            // Arrange
            const mockMinimalAdvertisement = {
                id: 'ad-minimal',
                title: 'Basic Ad',
                advertisement_type: 'TEXT',
                start_date: '2024-01-01T00:00:00.000Z',
                end_date: '2024-12-31T23:59:59.000Z',
                status: 'DRAFT',
                retailer: {
                    id: 'retailer-basic',
                    name: 'Basic Store',
                },
                images: [],
                products: [],
                analytics: {
                    views: 0,
                    clicks: 0,
                    conversions: 0,
                    ctr: 0,
                },
            };

            const mockResult = {
                mappedAdvertisement: mockMinimalAdvertisement,
                totalProducts: 0,
                currentPage: 1,
            };

            mockGetDetailedAdvertisementByID.mockResolvedValue(mockResult);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement retrieved successfully',
                status: status.OK,
                data: mockMinimalAdvertisement,
            });
        });

        it('should handle request with only advertisement_id (no page)', async () => {
            // Arrange
            const requestWithoutPage = {
                advertisement_id: 'ad-no-page',
            };

            const cleanedRequest = {
                advertisement_id: 'ad-no-page',
            };

            mockCall.request = requestWithoutPage as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const mockMappedAdvertisement = {
                id: 'ad-no-page',
                title: 'No Page Ad',
                advertisement_type: 'POPUP',
                status: 'ACTIVE',
            };

            const mockResult = {
                mappedAdvertisement: mockMappedAdvertisement,
                totalProducts: 0,
                currentPage: 1,
            };

            mockGetDetailedAdvertisementByID.mockResolvedValue(mockResult);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetDetailedAdvertisementByID).toHaveBeenCalledWith('ad-no-page', undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement retrieved successfully',
                status: status.OK,
                data: mockMappedAdvertisement,
            });
        });

        it('should properly clean request fields using utilFns.removeEmptyFields', async () => {
            // Arrange
            const requestWithEmptyFields = {
                advertisement_id: 'ad-clean-test',
                page: 2,
                empty_field: '',
                null_field: null,
                undefined_field: undefined,
            };

            const cleanedRequest = {
                advertisement_id: 'ad-clean-test',
                page: 2,
            };

            mockCall.request = requestWithEmptyFields as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const mockMappedAdvertisement = {
                id: 'ad-clean-test',
                title: 'Clean Test Ad',
                status: 'ACTIVE',
            };

            const mockResult = {
                mappedAdvertisement: mockMappedAdvertisement,
            };

            mockGetDetailedAdvertisementByID.mockResolvedValue(mockResult);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(mockGetDetailedAdvertisementByID).toHaveBeenCalledWith('ad-clean-test', 2);
        });
    });

    describe('Pagination Handling', () => {
        it('should handle different page numbers correctly', async () => {
            // Arrange
            const testCases = [
                { page: 1, expectedPage: 1 },
                { page: 5, expectedPage: 5 },
                { page: 100, expectedPage: 100 },
                { page: 0, expectedPage: 0 },
            ];

            for (const testCase of testCases) {
                jest.clearAllMocks();
                
                mockCall.request = {
                    advertisement_id: 'ad-pagination-test',
                    page: testCase.page,
                } as any;

                const mockResult = {
                    mappedAdvertisement: {
                        id: 'ad-pagination-test',
                        title: `Page ${testCase.page} Ad`,
                        status: 'ACTIVE',
                    },
                };

                mockGetDetailedAdvertisementByID.mockResolvedValue(mockResult);

                // Act
                await getSingleAdvertisement(mockCall, mockCallback);

                // Assert
                expect(mockGetDetailedAdvertisementByID).toHaveBeenCalledWith(
                    'ad-pagination-test',
                    testCase.expectedPage
                );
            }
        });
    });

    describe('Data Structure Validation', () => {
        it('should handle advertisement with complex product matching data', async () => {
            // Arrange
            const mockComplexAdvertisement = {
                id: 'ad-complex',
                title: 'Complex Product Matching Ad',
                advertisement_type: 'VIDEO',
                status: 'ACTIVE',
                products: [
                    {
                        id: 'prod-matched',
                        name: 'Matched Product',
                        price: 99.99,
                        match_type: 'MATCHED',
                        confidence_score: 0.98,
                        categories: ['electronics', 'smartphones'],
                        brand: 'TechBrand',
                        sku: 'TB-SMART-001',
                    },
                    {
                        id: 'prod-in-progress',
                        name: 'In Progress Product',
                        price: 149.99,
                        match_type: 'IN_PROGRESS',
                        confidence_score: 0.65,
                        categories: ['electronics', 'tablets'],
                        brand: 'TechBrand',
                        sku: 'TB-TAB-001',
                    },
                    {
                        id: 'prod-not-matched',
                        name: 'Not Matched Product',
                        price: 199.99,
                        match_type: 'NOT_MATCHED',
                        confidence_score: 0.30,
                        categories: ['electronics', 'laptops'],
                        brand: 'TechBrand',
                        sku: 'TB-LAP-001',
                    },
                ],
                analytics: {
                    views: 50000,
                    clicks: 2500,
                    conversions: 125,
                    ctr: 0.05,
                    conversion_rate: 0.05,
                    revenue: 12500.00,
                },
            };

            const mockResult = {
                mappedAdvertisement: mockComplexAdvertisement,
                totalProducts: 3,
                currentPage: 1,
            };

            mockGetDetailedAdvertisementByID.mockResolvedValue(mockResult);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            expect(response.data.products).toHaveLength(3);
            expect(response.data.products[0].match_type).toBe('MATCHED');
            expect(response.data.products[1].match_type).toBe('IN_PROGRESS');
            expect(response.data.products[2].match_type).toBe('NOT_MATCHED');
            expect(response.data.analytics.revenue).toBe(12500.00);
        });

        it('should handle advertisement with multiple images and metadata', async () => {
            // Arrange
            const mockImageRichAdvertisement = {
                id: 'ad-images',
                title: 'Image Rich Advertisement',
                advertisement_type: 'CAROUSEL',
                status: 'ACTIVE',
                images: [
                    {
                        id: 'img-hero',
                        url: 'https://example.com/hero.jpg',
                        alt_text: 'Hero image',
                        width: 1920,
                        height: 1080,
                        file_size: 245760,
                        format: 'JPEG',
                    },
                    {
                        id: 'img-product-1',
                        url: 'https://example.com/product1.jpg',
                        alt_text: 'Product showcase 1',
                        width: 800,
                        height: 600,
                        file_size: 102400,
                        format: 'JPEG',
                    },
                    {
                        id: 'img-product-2',
                        url: 'https://example.com/product2.jpg',
                        alt_text: 'Product showcase 2',
                        width: 800,
                        height: 600,
                        file_size: 98304,
                        format: 'PNG',
                    },
                ],
                retailer: {
                    id: 'retailer-premium',
                    name: 'Premium Store',
                    logo: 'https://example.com/premium-logo.png',
                    website: 'https://premiumstore.com',
                    description: 'Premium products for discerning customers',
                },
            };

            const mockResult = {
                mappedAdvertisement: mockImageRichAdvertisement,
                totalProducts: 0,
                currentPage: 1,
            };

            mockGetDetailedAdvertisementByID.mockResolvedValue(mockResult);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            expect(response.data.images).toHaveLength(3);
            expect(response.data.images[0].format).toBe('JPEG');
            expect(response.data.images[2].format).toBe('PNG');
            expect(response.data.retailer.website).toBe('https://premiumstore.com');
        });
    });

    describe('Error Handling', () => {
        it('should return NOT_FOUND when advertisement does not exist', async () => {
            // Arrange
            mockGetDetailedAdvertisementByID.mockResolvedValue(null);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetDetailedAdvertisementByID).toHaveBeenCalledWith('ad-123', 1);
            
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement not found',
                status: status.NOT_FOUND,
                data: null,
            });
        });

        it('should return NOT_FOUND when advertisement is undefined', async () => {
            // Arrange
            mockGetDetailedAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement not found',
                status: status.NOT_FOUND,
                data: null,
            });
        });

        it('should handle getDetailedAdvertisementByID service error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            mockGetDetailedAdvertisementByID.mockRejectedValue(mockError);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

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
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
                data: null,
            });
        });

        it('should handle advertisement data validation scenarios', async () => {
            // Arrange
            // Test that the function handles various data scenarios gracefully
            const mockValidAdvertisement = {
                id: 'ad-validation-test',
                title: 'Validation Test Ad',
                status: 'ACTIVE',
                data_that_might_be_missing: undefined,
                nested_object: {
                    property: 'value'
                }
            };

            const mockResult = {
                mappedAdvertisement: mockValidAdvertisement,
                totalProducts: 0,
                currentPage: 1,
            };

            mockGetDetailedAdvertisementByID.mockResolvedValue(mockResult);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement retrieved successfully',
                status: status.OK,
                data: mockValidAdvertisement,
            });
        });

        it('should handle service returning result with null mappedAdvertisement', async () => {
            // Arrange
            const mockResultWithNullData = {
                mappedAdvertisement: null,
                totalProducts: 0,
                currentPage: 1,
            };

            mockGetDetailedAdvertisementByID.mockResolvedValue(mockResultWithNullData);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement retrieved successfully',
                status: status.OK,
                data: null,
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing advertisement_id in request', async () => {
            // Arrange
            const requestWithoutId = {
                page: 1,
            };

            const cleanedRequest = {
                page: 1,
            };

            mockCall.request = requestWithoutId as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            mockGetDetailedAdvertisementByID.mockResolvedValue(null);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetDetailedAdvertisementByID).toHaveBeenCalledWith(undefined, 1);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement not found',
                status: status.NOT_FOUND,
                data: null,
            });
        });

        it('should handle empty string advertisement_id', async () => {
            // Arrange
            mockCall.request = {
                advertisement_id: '',
                page: 1,
            } as any;

            mockGetDetailedAdvertisementByID.mockResolvedValue(null);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetDetailedAdvertisementByID).toHaveBeenCalledWith('', 1);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement not found',
                status: status.NOT_FOUND,
                data: null,
            });
        });

        it('should handle very long advertisement_id', async () => {
            // Arrange
            const longAdId = 'a'.repeat(1000);
            mockCall.request = {
                advertisement_id: longAdId,
                page: 1,
            } as any;

            mockGetDetailedAdvertisementByID.mockResolvedValue(null);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetDetailedAdvertisementByID).toHaveBeenCalledWith(longAdId, 1);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement not found',
                status: status.NOT_FOUND,
                data: null,
            });
        });

        it('should handle negative page numbers', async () => {
            // Arrange
            mockCall.request = {
                advertisement_id: 'ad-negative-page',
                page: -1,
            } as any;

            const mockMappedAdvertisement = {
                id: 'ad-negative-page',
                title: 'Negative Page Test',
                status: 'ACTIVE',
            };

            const mockResult = {
                mappedAdvertisement: mockMappedAdvertisement,
            };

            mockGetDetailedAdvertisementByID.mockResolvedValue(mockResult);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetDetailedAdvertisementByID).toHaveBeenCalledWith('ad-negative-page', -1);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement retrieved successfully',
                status: status.OK,
                data: mockMappedAdvertisement,
            });
        });

        it('should handle advertisement with special characters in data', async () => {
            // Arrange
            const mockSpecialCharsAdvertisement = {
                id: 'ad-special-chars',
                title: 'Spéçiál Déals! 50% Off & Free Shipping "Today Only" 🎉',
                description: 'Ünicödé text with émojis & special çharacters',
                advertisement_type: 'EMAIL',
                status: 'ACTIVE',
                retailer: {
                    id: 'retailer-special',
                    name: 'Spéçiál Störe & Co. 🛍️',
                },
                products: [
                    {
                        id: 'prod-unicode',
                        name: 'Prodüct with Ünicödé Name 🎯',
                        price: 99.99,
                        match_type: 'MATCHED',
                        confidence_score: 0.95,
                    },
                ],
            };

            const mockResult = {
                mappedAdvertisement: mockSpecialCharsAdvertisement,
                totalProducts: 1,
                currentPage: 1,
            };

            mockGetDetailedAdvertisementByID.mockResolvedValue(mockResult);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            expect(response.data.title).toBe('Spéçiál Déals! 50% Off & Free Shipping "Today Only" 🎉');
            expect(response.data.retailer.name).toBe('Spéçiál Störe & Co. 🛍️');
            expect(response.data.products[0].name).toBe('Prodüct with Ünicödé Name 🎯');
            expect(response.status).toBe(status.OK);
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle complete realistic advertisement retrieval workflow', async () => {
            // Arrange
            const realisticRequest = {
                advertisement_id: 'summer-electronics-2024-campaign',
                page: 2,
                extra_param: 'should_be_removed',
                empty_string: '',
            };

            const cleanedRequest = {
                advertisement_id: 'summer-electronics-2024-campaign',
                page: 2,
            };

            mockCall.request = realisticRequest as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const realisticAdvertisement = {
                id: 'summer-electronics-2024-campaign',
                title: 'Summer Electronics Sale 2024',
                description: 'Discover amazing deals on the latest electronics this summer',
                advertisement_type: 'BANNER',
                start_date: '2024-06-01T00:00:00.000Z',
                end_date: '2024-08-31T23:59:59.000Z',
                status: 'ACTIVE',
                retailer: {
                    id: 'electronics-superstore',
                    name: 'Electronics Superstore',
                    logo: 'https://cdn.electronics-superstore.com/logo.png',
                    website: 'https://electronics-superstore.com',
                },
                images: [
                    {
                        id: 'hero-banner-summer-2024',
                        url: 'https://cdn.electronics-superstore.com/summer-sale-hero.jpg',
                        alt_text: 'Summer electronics sale hero banner',
                        width: 1920,
                        height: 1080,
                    },
                ],
                products: [
                    {
                        id: 'smartphone-galaxy-s24',
                        name: 'Samsung Galaxy S24',
                        price: 899.99,
                        match_type: 'MATCHED',
                        confidence_score: 0.98,
                        brand: 'Samsung',
                        sku: 'SAMS-GS24-128GB',
                    },
                    {
                        id: 'laptop-macbook-air-m3',
                        name: 'MacBook Air M3',
                        price: 1299.99,
                        match_type: 'MATCHED',
                        confidence_score: 0.96,
                        brand: 'Apple',
                        sku: 'APPL-MBA-M3-256GB',
                    },
                ],
                analytics: {
                    views: 125000,
                    clicks: 7500,
                    conversions: 375,
                    ctr: 0.06,
                    conversion_rate: 0.05,
                    revenue: 468750.00,
                },
                created_at: '2024-05-15T09:00:00.000Z',
                updated_at: '2024-06-01T14:30:00.000Z',
            };

            const mockResult = {
                mappedAdvertisement: realisticAdvertisement,
                totalProducts: 25,
                currentPage: 2,
            };

            mockGetDetailedAdvertisementByID.mockResolvedValue(mockResult);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(realisticRequest);
            expect(mockGetDetailedAdvertisementByID).toHaveBeenCalledWith(
                'summer-electronics-2024-campaign',
                2
            );

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement retrieved successfully',
                status: status.OK,
                data: realisticAdvertisement,
            });

            // Verify the response structure
            const response = mockCallback.mock.calls[0][1];
            expect(response.data.id).toBe('summer-electronics-2024-campaign');
            expect(response.data.products).toHaveLength(2);
            expect(response.data.analytics.revenue).toBe(468750.00);
            expect(response.data.retailer.website).toBe('https://electronics-superstore.com');
        });

        it('should handle edge case with empty but valid result', async () => {
            // Arrange
            const emptyValidAdvertisement = {
                id: 'ad-empty-valid',
                title: '',
                description: null,
                advertisement_type: 'TEXT',
                status: 'DRAFT',
                retailer: {
                    id: 'retailer-minimal',
                    name: '',
                },
                images: [],
                products: [],
                analytics: null,
            };

            const mockResult = {
                mappedAdvertisement: emptyValidAdvertisement,
                totalProducts: 0,
                currentPage: 1,
            };

            mockGetDetailedAdvertisementByID.mockResolvedValue(mockResult);

            // Act
            await getSingleAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement retrieved successfully',
                status: status.OK,
                data: emptyValidAdvertisement,
            });

            const response = mockCallback.mock.calls[0][1];
            expect(response.data.title).toBe('');
            expect(response.data.description).toBeNull();
            expect(response.data.images).toEqual([]);
            expect(response.data.products).toEqual([]);
            expect(response.data.analytics).toBeNull();
        });
    });
});