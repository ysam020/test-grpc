import {
    errorMessage,
    ProductMatch,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetAdvertisementsRequest__Output,
    GetAdvertisementsResponse,
    GetAdvertisementsResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { prismaClient } from '@atc/db';
import {
    getRetailerByID,
    getAllAdvertisements,
} from '../../../src/services/model.service';
import { getAdvertisements } from '../../../src/handlers/getAdvertisements';

// Mock all dependencies following the project pattern
jest.mock('@atc/common', () => ({
    errorMessage: {
        RETAILER: {
            NOT_FOUND: 'Retailer not found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        ADVERTISEMENT: {
            RETRIEVED: 'Advertisements retrieved successfully',
        },
    },
    ProductMatch: {
        MATCHED: 'MATCHED',
        NOT_MATCHED: 'NOT_MATCHED',
        IN_PROGRESS: 'IN_PROGRESS',
    },
    utilFns: {
        removeEmptyFields: jest.fn(),
        getProductMatchStatus: jest.fn(),
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

jest.mock('../../../src/services/model.service');
jest.mock('@atc/db');

describe('getAdvertisements', () => {
    let mockCall: jest.Mocked<CustomServerUnaryCall<GetAdvertisementsRequest__Output, GetAdvertisementsResponse>>;
    let mockCallback: jest.MockedFunction<sendUnaryData<GetAdvertisementsResponse__Output>>;
    let mockGetRetailerByID: jest.MockedFunction<typeof getRetailerByID>;
    let mockGetAllAdvertisements: jest.MockedFunction<typeof getAllAdvertisements>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mocks
        mockGetRetailerByID = getRetailerByID as jest.MockedFunction<typeof getRetailerByID>;
        mockGetAllAdvertisements = getAllAdvertisements as jest.MockedFunction<typeof getAllAdvertisements>;

        // Mock call object with default request
        mockCall = {
            request: {
                page: 1,
                limit: 10,
                retailer_id: 'retailer-123',
                advertisement_type: 'BANNER',
                year: 2024,
                month: 3,
                product_match: 'MATCHED' as any,
                keyword: 'electronics',
            },
        } as any;

        // Mock callback function
        mockCallback = jest.fn();

        // Default mock implementations
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation((obj) => obj);
        (utilFns.getProductMatchStatus as jest.Mock).mockImplementation((percentage) => {
            if (percentage >= 80) return 'MATCHED';
            if (percentage >= 50) return 'IN_PROGRESS';
            return 'NOT_MATCHED';
        });
    });

    describe('Successful Operations', () => {
        it('should successfully retrieve advertisements with complete data', async () => {
            // Arrange
            const mockRetailer = {
                id: 'retailer-123',
                retailer_name: 'SuperMart',
            };

            const mockAdvertisements = [
                {
                    id: 'ad-001',
                    title: 'Spring Sale 2024',
                    advertisement_type: 'BANNER',
                    start_date: new Date('2024-03-01T00:00:00Z'),
                    end_date: new Date('2024-03-31T23:59:59Z'),
                    advertisement_status: 'APPROVED',
                    match_percentage: 85,
                    keyword: 'electronics',
                    Retailer: {
                        id: 'retailer-123',
                        retailer_name: 'SuperMart',
                    },
                    AdvertisementImage: [
                        { id: 'img-001' },
                        { id: 'img-002' },
                    ],
                },
                {
                    id: 'ad-002',
                    title: 'Electronics Clearance',
                    advertisement_type: 'POPUP',
                    start_date: new Date('2024-03-15T00:00:00Z'),
                    end_date: new Date('2024-03-25T23:59:59Z'),
                    advertisement_status: 'PENDING',
                    match_percentage: 65,
                    keyword: 'phones',
                    Retailer: {
                        id: 'retailer-456',
                        retailer_name: 'TechStore',
                    },
                    AdvertisementImage: [],
                },
            ];

            const mockTotalCount = 25;

            mockGetRetailerByID.mockResolvedValue(mockRetailer);
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: mockTotalCount,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(mockGetRetailerByID).toHaveBeenCalledWith('retailer-123');
            expect(mockGetAllAdvertisements).toHaveBeenCalledWith(
                1,
                10,
                'retailer-123',
                'BANNER',
                2024,
                3,
                'MATCHED',
                'electronics'
            );

            expect(utilFns.getProductMatchStatus).toHaveBeenCalledWith(85);
            expect(utilFns.getProductMatchStatus).toHaveBeenCalledWith(65);

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisements retrieved successfully',
                status: status.OK,
                data: {
                    advertisements: [
                        {
                            id: 'ad-001',
                            title: 'Spring Sale 2024',
                            retailer: {
                                id: 'retailer-123',
                                name: 'SuperMart',
                            },
                            advertisement_type: 'BANNER',
                            start_date: '2024-03-01T00:00:00.000Z',
                            end_date: '2024-03-31T23:59:59.000Z',
                            status: 'APPROVED',
                            product_match: 'MATCHED',
                            match_percentage: 85,
                            image: 'img-001',
                            keyword: 'electronics',
                        },
                        {
                            id: 'ad-002',
                            title: 'Electronics Clearance',
                            retailer: {
                                id: 'retailer-456',
                                name: 'TechStore',
                            },
                            advertisement_type: 'POPUP',
                            start_date: '2024-03-15T00:00:00.000Z',
                            end_date: '2024-03-25T23:59:59.000Z',
                            status: 'PENDING',
                            product_match: 'IN_PROGRESS',
                            match_percentage: 65,
                            image: '',
                            keyword: 'phones',
                        },
                    ],
                    total_count: 25,
                },
            });
        });

        it('should successfully handle request without retailer_id', async () => {
            // Arrange
            mockCall.request = {
                page: 1,
                limit: 5,
                advertisement_type: 'VIDEO',
                year: 2024,
            } as any;

            const mockAdvertisements = [
                {
                    id: 'ad-no-retailer',
                    title: 'Global Ad',
                    advertisement_type: 'VIDEO',
                    start_date: new Date('2024-01-01T00:00:00Z'),
                    end_date: new Date('2024-12-31T23:59:59Z'),
                    advertisement_status: 'ACTIVE',
                    match_percentage: 90,
                    keyword: null,
                    Retailer: {
                        id: 'retailer-global',
                        retailer_name: 'Global Store',
                    },
                    AdvertisementImage: [{ id: 'global-img' }],
                },
            ];

            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 1,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            expect(mockGetRetailerByID).not.toHaveBeenCalled();
            expect(mockGetAllAdvertisements).toHaveBeenCalledWith(
                1,
                5,
                undefined,
                'VIDEO',
                2024,
                undefined,
                undefined,
                undefined
            );

            const response = mockCallback.mock.calls[0][1];
            expect(response.data.advertisements[0].keyword).toBe('');
        });

        it('should handle empty advertisements list', async () => {
            // Arrange
            const mockRetailer = { id: 'retailer-123', retailer_name: 'SuperMart' };
            
            mockGetRetailerByID.mockResolvedValue(mockRetailer);
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: [],
                totalCount: 0,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisements retrieved successfully',
                status: status.OK,
                data: {
                    advertisements: [],
                    total_count: 0,
                },
            });
        });
    });

    describe('Parameter Handling', () => {
        it('should handle request with minimal parameters', async () => {
            // Arrange
            const minimalRequest = {
                page: 1,
                limit: 10,
            };

            mockCall.request = minimalRequest as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(minimalRequest);
            
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: [],
                totalCount: 0,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            expect(mockGetRetailerByID).not.toHaveBeenCalled();
            expect(mockGetAllAdvertisements).toHaveBeenCalledWith(
                1,
                10,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined
            );
        });

        it('should handle request with all filters', async () => {
            // Arrange
            const fullRequest = {
                page: 2,
                limit: 20,
                retailer_id: 'retailer-456',
                advertisement_type: 'EMAIL',
                year: 2023,
                month: 12,
                product_match: 'NOT_MATCHED',
                keyword: 'fashion',
            };

            mockCall.request = fullRequest as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(fullRequest);
            
            const mockRetailer = { id: 'retailer-456', retailer_name: 'Fashion Store' };
            mockGetRetailerByID.mockResolvedValue(mockRetailer);
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: [],
                totalCount: 0,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            expect(mockGetRetailerByID).toHaveBeenCalledWith('retailer-456');
            expect(mockGetAllAdvertisements).toHaveBeenCalledWith(
                2,
                20,
                'retailer-456',
                'EMAIL',
                2023,
                12,
                'NOT_MATCHED',
                'fashion'
            );
        });

        it('should properly clean request fields using utilFns.removeEmptyFields', async () => {
            // Arrange
            const requestWithEmptyFields = {
                page: 1,
                limit: 10,
                retailer_id: 'retailer-123',
                advertisement_type: 'BANNER',
                keyword: 'electronics',
                empty_field: '',
                null_field: null,
            };

            const cleanedRequest = {
                page: 1,
                limit: 10,
                retailer_id: 'retailer-123',
                advertisement_type: 'BANNER',
                keyword: 'electronics',
            };

            mockCall.request = requestWithEmptyFields as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);
            
            const mockRetailer = { id: 'retailer-123', retailer_name: 'SuperMart' };
            mockGetRetailerByID.mockResolvedValue(mockRetailer);
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: [],
                totalCount: 0,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(mockGetAllAdvertisements).toHaveBeenCalledWith(
                1,
                10,
                'retailer-123',
                'BANNER',
                undefined,
                undefined,
                undefined,
                'electronics'
            );
        });
    });

    describe('Data Transformation', () => {
        it('should correctly transform advertisement data structure', async () => {
            // Arrange
            const mockAdvertisements = [
                {
                    id: 'ad-transform-test',
                    title: 'Transform Test Ad',
                    advertisement_type: 'SOCIAL_MEDIA',
                    start_date: new Date('2024-06-15T14:30:00Z'),
                    end_date: new Date('2024-06-20T18:45:00Z'),
                    advertisement_status: 'DRAFT',
                    match_percentage: 75,
                    keyword: 'summer sale',
                    Retailer: {
                        id: 'retailer-transform',
                        retailer_name: 'Transform Store',
                    },
                    AdvertisementImage: [
                        { id: 'transform-img-1' },
                        { id: 'transform-img-2' },
                    ],
                },
            ];

            // Mock retailer check since we have retailer_id in request
            const mockRetailer = { id: 'retailer-123', retailer_name: 'SuperMart' };
            mockGetRetailerByID.mockResolvedValue(mockRetailer);
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 1,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const transformedAd = response.data.advertisements[0];

            expect(transformedAd).toEqual({
                id: 'ad-transform-test',
                title: 'Transform Test Ad',
                retailer: {
                    id: 'retailer-transform',
                    name: 'Transform Store',
                },
                advertisement_type: 'SOCIAL_MEDIA',
                start_date: '2024-06-15T14:30:00.000Z',
                end_date: '2024-06-20T18:45:00.000Z',
                status: 'DRAFT',
                product_match: 'IN_PROGRESS',
                match_percentage: 75,
                image: 'transform-img-1',
                keyword: 'summer sale',
            });
        });

        it('should handle missing or null fields correctly', async () => {
            // Arrange
            const mockAdvertisements = [
                {
                    id: 'ad-missing-fields',
                    title: 'Missing Fields Ad',
                    advertisement_type: 'BANNER',
                    start_date: new Date('2024-01-01T00:00:00Z'),
                    end_date: new Date('2024-12-31T23:59:59Z'),
                    advertisement_status: 'ACTIVE',
                    match_percentage: 0,
                    keyword: null,
                    Retailer: {
                        id: 'retailer-missing',
                        retailer_name: 'Missing Store',
                    },
                    AdvertisementImage: [], // Empty array
                },
            ];

            // Mock retailer check since we have retailer_id in request
            const mockRetailer = { id: 'retailer-123', retailer_name: 'SuperMart' };
            mockGetRetailerByID.mockResolvedValue(mockRetailer);
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 1,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const transformedAd = response.data.advertisements[0];

            expect(transformedAd.image).toBe('');
            expect(transformedAd.keyword).toBe('');
            expect(transformedAd.match_percentage).toBe(0);
        });

        it('should correctly use utilFns.getProductMatchStatus for different percentages', async () => {
            // Arrange
            const mockAdvertisements = [
                {
                    id: 'ad-high-match',
                    title: 'High Match Ad',
                    advertisement_type: 'BANNER',
                    start_date: new Date('2024-01-01T00:00:00Z'),
                    end_date: new Date('2024-12-31T23:59:59Z'),
                    advertisement_status: 'ACTIVE',
                    match_percentage: 95,
                    keyword: 'test',
                    Retailer: { id: 'r1', retailer_name: 'Store 1' },
                    AdvertisementImage: [],
                },
                {
                    id: 'ad-medium-match',
                    title: 'Medium Match Ad',
                    advertisement_type: 'POPUP',
                    start_date: new Date('2024-01-01T00:00:00Z'),
                    end_date: new Date('2024-12-31T23:59:59Z'),
                    advertisement_status: 'PENDING',
                    match_percentage: 60,
                    keyword: 'test',
                    Retailer: { id: 'r2', retailer_name: 'Store 2' },
                    AdvertisementImage: [],
                },
                {
                    id: 'ad-low-match',
                    title: 'Low Match Ad',
                    advertisement_type: 'EMAIL',
                    start_date: new Date('2024-01-01T00:00:00Z'),
                    end_date: new Date('2024-12-31T23:59:59Z'),
                    advertisement_status: 'DRAFT',
                    match_percentage: 30,
                    keyword: 'test',
                    Retailer: { id: 'r3', retailer_name: 'Store 3' },
                    AdvertisementImage: [],
                },
            ];

            // Mock retailer check since we have retailer_id in request
            const mockRetailer = { id: 'retailer-123', retailer_name: 'SuperMart' };
            mockGetRetailerByID.mockResolvedValue(mockRetailer);
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 3,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            expect(utilFns.getProductMatchStatus).toHaveBeenCalledWith(95);
            expect(utilFns.getProductMatchStatus).toHaveBeenCalledWith(60);
            expect(utilFns.getProductMatchStatus).toHaveBeenCalledWith(30);

            const response = mockCallback.mock.calls[0][1];
            expect(response.data.advertisements[0].product_match).toBe('MATCHED');
            expect(response.data.advertisements[1].product_match).toBe('IN_PROGRESS');
            expect(response.data.advertisements[2].product_match).toBe('NOT_MATCHED');
        });

        it('should handle date conversion to ISO string correctly', async () => {
            // Arrange
            const specificDate = new Date('2024-07-15T10:30:45.123Z');
            const mockAdvertisements = [
                {
                    id: 'ad-date-test',
                    title: 'Date Test Ad',
                    advertisement_type: 'BANNER',
                    start_date: specificDate,
                    end_date: specificDate,
                    advertisement_status: 'ACTIVE',
                    match_percentage: 80,
                    keyword: 'date test',
                    Retailer: { id: 'r1', retailer_name: 'Date Store' },
                    AdvertisementImage: [],
                },
            ];

            // Mock retailer check since we have retailer_id in request
            const mockRetailer = { id: 'retailer-123', retailer_name: 'SuperMart' };
            mockGetRetailerByID.mockResolvedValue(mockRetailer);
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 1,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const transformedAd = response.data.advertisements[0];

            expect(transformedAd.start_date).toBe('2024-07-15T10:30:45.123Z');
            expect(transformedAd.end_date).toBe('2024-07-15T10:30:45.123Z');
        });
    });

    describe('Error Handling', () => {
        it('should return NOT_FOUND when retailer does not exist', async () => {
            // Arrange
            mockGetRetailerByID.mockResolvedValue(null);

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            expect(mockGetRetailerByID).toHaveBeenCalledWith('retailer-123');
            expect(mockGetAllAdvertisements).not.toHaveBeenCalled();
            
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Retailer not found',
                status: status.NOT_FOUND,
                data: null,
            });
        });

        it('should handle getRetailerByID service error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            mockGetRetailerByID.mockRejectedValue(mockError);

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
                data: null,
            });
        });

        it('should handle getAllAdvertisements service error', async () => {
            // Arrange
            const mockRetailer = { id: 'retailer-123', retailer_name: 'SuperMart' };
            const mockError = new Error('Advertisements query failed');
            
            mockGetRetailerByID.mockResolvedValue(mockRetailer);
            mockGetAllAdvertisements.mockRejectedValue(mockError);

            // Act
            await getAdvertisements(mockCall, mockCallback);

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
            await getAdvertisements(mockCall, mockCallback);

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
            const mockRetailer = { id: 'retailer-123', retailer_name: 'SuperMart' };
            const mockMalformedAdvertisements = [
                {
                    id: 'ad-001',
                    title: 'Test Ad',
                    advertisement_type: 'BANNER',
                    start_date: null, // This will cause error during transformation
                    end_date: new Date('2024-03-31T23:59:59Z'),
                    advertisement_status: 'ACTIVE',
                    match_percentage: 80,
                    keyword: 'test',
                    Retailer: { id: 'r1', retailer_name: 'Store 1' },
                    AdvertisementImage: [],
                },
            ];

            mockGetRetailerByID.mockResolvedValue(mockRetailer);
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockMalformedAdvertisements,
                totalCount: 1,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
                data: null,
            });
        });

        it('should handle utilFns.getProductMatchStatus error', async () => {
            // Arrange
            const mockRetailer = { id: 'retailer-123', retailer_name: 'SuperMart' };
            const mockAdvertisements = [
                {
                    id: 'ad-001',
                    title: 'Test Ad',
                    advertisement_type: 'BANNER',
                    start_date: new Date('2024-01-01T00:00:00Z'),
                    end_date: new Date('2024-12-31T23:59:59Z'),
                    advertisement_status: 'ACTIVE',
                    match_percentage: 80,
                    keyword: 'test',
                    Retailer: { id: 'r1', retailer_name: 'Store 1' },
                    AdvertisementImage: [],
                },
            ];

            mockGetRetailerByID.mockResolvedValue(mockRetailer);
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 1,
            });

            const mockError = new Error('Product match status calculation failed');
            (utilFns.getProductMatchStatus as jest.Mock).mockImplementation(() => {
                throw mockError;
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
                data: null,
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle advertisements with special characters in titles and keywords', async () => {
            // Arrange
            mockCall.request = {
                page: 1,
                limit: 10,
                // No retailer_id to skip retailer validation
            } as any;

            const mockAdvertisements = [
                {
                    id: 'ad-special-chars',
                    title: 'Special Deal! 50% Off & Free Shipping "Today Only" 🎉',
                    advertisement_type: 'EMAIL',
                    start_date: new Date('2024-03-01T00:00:00Z'),
                    end_date: new Date('2024-03-01T23:59:59Z'),
                    advertisement_status: 'ACTIVE',
                    match_percentage: 85,
                    keyword: 'déal & spéçial çhars 🛍️',
                    Retailer: {
                        id: 'retailer-special',
                        retailer_name: 'Spéçial Störe & Co.',
                    },
                    AdvertisementImage: [{ id: 'special-img' }],
                },
            ];

            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 1,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const transformedAd = response.data.advertisements[0];

            expect(transformedAd.title).toBe('Special Deal! 50% Off & Free Shipping "Today Only" 🎉');
            expect(transformedAd.keyword).toBe('déal & spéçial çhars 🛍️');
            expect(transformedAd.retailer.name).toBe('Spéçial Störe & Co.');
        });

        it('should handle large number of advertisements', async () => {
            // Arrange
            const mockRetailer = { id: 'retailer-123', retailer_name: 'SuperMart' };
            const mockAdvertisements = Array.from({ length: 100 }, (_, index) => ({
                id: `ad-${index.toString().padStart(3, '0')}`,
                title: `Advertisement ${index + 1}`,
                advertisement_type: 'BANNER',
                start_date: new Date('2024-01-01T00:00:00Z'),
                end_date: new Date('2024-12-31T23:59:59Z'),
                advertisement_status: 'ACTIVE',
                match_percentage: Math.floor(Math.random() * 100),
                keyword: `keyword-${index}`,
                Retailer: {
                    id: `retailer-${index}`,
                    retailer_name: `Retailer ${index + 1}`,
                },
                AdvertisementImage: [{ id: `img-${index}` }],
            }));

            mockGetRetailerByID.mockResolvedValue(mockRetailer);
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 100,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            expect(response.data.advertisements).toHaveLength(100);
            expect(response.data.total_count).toBe(100);
            expect(response.data.advertisements[0].id).toBe('ad-000');
            expect(response.data.advertisements[99].id).toBe('ad-099');
        });

        it('should handle different advertisement types and statuses', async () => {
            // Arrange
            mockCall.request = {
                page: 1,
                limit: 10,
                // No retailer_id to skip retailer validation
            } as any;

            const adTypes = ['BANNER', 'POPUP', 'EMAIL', 'SOCIAL_MEDIA', 'VIDEO'];
            const statuses = ['ACTIVE', 'PENDING', 'DRAFT', 'APPROVED', 'REJECTED'];

            const mockAdvertisements = adTypes.map((type, index) => ({
                id: `ad-${type.toLowerCase()}`,
                title: `${type} Advertisement`,
                advertisement_type: type,
                start_date: new Date('2024-01-01T00:00:00Z'),
                end_date: new Date('2024-12-31T23:59:59Z'),
                advertisement_status: statuses[index],
                match_percentage: (index + 1) * 20,
                keyword: `${type.toLowerCase()}-keyword`,
                Retailer: {
                    id: `retailer-${type.toLowerCase()}`,
                    retailer_name: `${type} Store`,
                },
                AdvertisementImage: [{ id: `${type.toLowerCase()}-img` }],
            }));

            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: adTypes.length,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            expect(response.data.advertisements).toHaveLength(adTypes.length);
            
            adTypes.forEach((type, index) => {
                const ad = response.data.advertisements[index];
                expect(ad.advertisement_type).toBe(type);
                expect(ad.status).toBe(statuses[index]);
                expect(ad.retailer.name).toBe(`${type} Store`);
            });
        });

        it('should handle zero match percentage', async () => {
            // Arrange
            mockCall.request = {
                page: 1,
                limit: 10,
                // No retailer_id to skip retailer validation
            } as any;

            const mockAdvertisements = [
                {
                    id: 'ad-zero-match',
                    title: 'Zero Match Ad',
                    advertisement_type: 'BANNER',
                    start_date: new Date('2024-01-01T00:00:00Z'),
                    end_date: new Date('2024-12-31T23:59:59Z'),
                    advertisement_status: 'PENDING',
                    match_percentage: 0,
                    keyword: 'zero match',
                    Retailer: {
                        id: 'retailer-zero',
                        retailer_name: 'Zero Store',
                    },
                    AdvertisementImage: [],
                },
            ];

            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 1,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            expect(utilFns.getProductMatchStatus).toHaveBeenCalledWith(0);
            
            const response = mockCallback.mock.calls[0][1];
            expect(response.data.advertisements[0].match_percentage).toBe(0);
            expect(response.data.advertisements[0].product_match).toBe('NOT_MATCHED');
        });

        it('should handle maximum match percentage', async () => {
            // Arrange
            mockCall.request = {
                page: 1,
                limit: 10,
                // No retailer_id to skip retailer validation
            } as any;

            const mockAdvertisements = [
                {
                    id: 'ad-perfect-match',
                    title: 'Perfect Match Ad',
                    advertisement_type: 'BANNER',
                    start_date: new Date('2024-01-01T00:00:00Z'),
                    end_date: new Date('2024-12-31T23:59:59Z'),
                    advertisement_status: 'APPROVED',
                    match_percentage: 100,
                    keyword: 'perfect match',
                    Retailer: {
                        id: 'retailer-perfect',
                        retailer_name: 'Perfect Store',
                    },
                    AdvertisementImage: [{ id: 'perfect-img' }],
                },
            ];

            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 1,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            expect(utilFns.getProductMatchStatus).toHaveBeenCalledWith(100);
            
            const response = mockCallback.mock.calls[0][1];
            expect(response.data.advertisements[0].match_percentage).toBe(100);
            expect(response.data.advertisements[0].product_match).toBe('MATCHED');
        });

        it('should handle advertisements with multiple images correctly', async () => {
            // Arrange
            mockCall.request = {
                page: 1,
                limit: 10,
                // No retailer_id to skip retailer validation
            } as any;

            const mockAdvertisements = [
                {
                    id: 'ad-multi-images',
                    title: 'Multi Images Ad',
                    advertisement_type: 'BANNER',
                    start_date: new Date('2024-01-01T00:00:00Z'),
                    end_date: new Date('2024-12-31T23:59:59Z'),
                    advertisement_status: 'ACTIVE',
                    match_percentage: 75,
                    keyword: 'multi images',
                    Retailer: {
                        id: 'retailer-multi',
                        retailer_name: 'Multi Store',
                    },
                    AdvertisementImage: [
                        { id: 'first-img' },
                        { id: 'second-img' },
                        { id: 'third-img' },
                        { id: 'fourth-img' },
                    ],
                },
            ];

            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 1,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            // Should only take the first image
            expect(response.data.advertisements[0].image).toBe('first-img');
        });

        it('should handle long text fields gracefully', async () => {
            // Arrange
            mockCall.request = {
                page: 1,
                limit: 10,
                // No retailer_id to skip retailer validation
            } as any;

            const longTitle = 'A'.repeat(1000); // Very long title
            const longKeyword = 'B'.repeat(500); // Very long keyword
            const longRetailerName = 'C'.repeat(300); // Very long retailer name

            const mockAdvertisements = [
                {
                    id: 'ad-long-text',
                    title: longTitle,
                    advertisement_type: 'EMAIL',
                    start_date: new Date('2024-01-01T00:00:00Z'),
                    end_date: new Date('2024-12-31T23:59:59Z'),
                    advertisement_status: 'DRAFT',
                    match_percentage: 50,
                    keyword: longKeyword,
                    Retailer: {
                        id: 'retailer-long',
                        retailer_name: longRetailerName,
                    },
                    AdvertisementImage: [{ id: 'long-img' }],
                },
            ];

            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 1,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const ad = response.data.advertisements[0];
            
            expect(ad.title).toBe(longTitle);
            expect(ad.keyword).toBe(longKeyword);
            expect(ad.retailer.name).toBe(longRetailerName);
            expect(response.status).toBe(status.OK);
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle mixed scenarios with some valid and edge case data', async () => {
            // Arrange
            const mockRetailer = { id: 'retailer-123', retailer_name: 'Mixed Store' };
            const mockAdvertisements = [
                // Normal advertisement
                {
                    id: 'ad-normal',
                    title: 'Normal Ad',
                    advertisement_type: 'BANNER',
                    start_date: new Date('2024-01-01T00:00:00Z'),
                    end_date: new Date('2024-12-31T23:59:59Z'),
                    advertisement_status: 'ACTIVE',
                    match_percentage: 85,
                    keyword: 'normal',
                    Retailer: { id: 'r1', retailer_name: 'Normal Store' },
                    AdvertisementImage: [{ id: 'normal-img' }],
                },
                // Advertisement with null keyword
                {
                    id: 'ad-null-keyword',
                    title: 'Null Keyword Ad',
                    advertisement_type: 'POPUP',
                    start_date: new Date('2024-02-01T00:00:00Z'),
                    end_date: new Date('2024-02-28T23:59:59Z'),
                    advertisement_status: 'PENDING',
                    match_percentage: 0,
                    keyword: null,
                    Retailer: { id: 'r2', retailer_name: 'Null Store' },
                    AdvertisementImage: [],
                },
                // Advertisement with special characters
                {
                    id: 'ad-special',
                    title: 'Spéçiál Çhars & Émojis 🎯',
                    advertisement_type: 'EMAIL',
                    start_date: new Date('2024-03-01T00:00:00Z'),
                    end_date: new Date('2024-03-31T23:59:59Z'),
                    advertisement_status: 'APPROVED',
                    match_percentage: 95,
                    keyword: 'spéçiál & ünicode 🌟',
                    Retailer: { id: 'r3', retailer_name: 'Spéçiál Store' },
                    AdvertisementImage: [{ id: 'special-img-1' }, { id: 'special-img-2' }],
                },
            ];

            mockGetRetailerByID.mockResolvedValue(mockRetailer);
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 3,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            expect(response.data.advertisements).toHaveLength(3);
            
            // Normal ad
            expect(response.data.advertisements[0].keyword).toBe('normal');
            expect(response.data.advertisements[0].image).toBe('normal-img');
            expect(response.data.advertisements[0].product_match).toBe('MATCHED');
            
            // Null keyword ad
            expect(response.data.advertisements[1].keyword).toBe('');
            expect(response.data.advertisements[1].image).toBe('');
            expect(response.data.advertisements[1].product_match).toBe('NOT_MATCHED');
            
            // Special characters ad
            expect(response.data.advertisements[2].keyword).toBe('spéçiál & ünicode 🌟');
            expect(response.data.advertisements[2].image).toBe('special-img-1'); // First image only
            expect(response.data.advertisements[2].product_match).toBe('MATCHED');
        });

        it('should handle pagination edge cases', async () => {
            // Arrange
            const paginationRequest = {
                page: 0, // Edge case: zero page
                limit: 0, // Edge case: zero limit
                retailer_id: 'retailer-123',
            };

            mockCall.request = paginationRequest as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(paginationRequest);
            
            const mockRetailer = { id: 'retailer-123', retailer_name: 'Pagination Store' };
            mockGetRetailerByID.mockResolvedValue(mockRetailer);
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: [],
                totalCount: 0,
            });

            // Act
            await getAdvertisements(mockCall, mockCallback);

            // Assert
            expect(mockGetAllAdvertisements).toHaveBeenCalledWith(
                0, // page
                0, // limit
                'retailer-123',
                undefined,
                undefined,
                undefined,
                undefined,
                undefined
            );

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisements retrieved successfully',
                status: status.OK,
                data: {
                    advertisements: [],
                    total_count: 0,
                },
            });
        });
    });
});