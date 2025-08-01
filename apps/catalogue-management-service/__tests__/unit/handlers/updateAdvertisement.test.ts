import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DefaultResponse,
    DefaultResponse__Output,
    UpdateAdvertisementRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getAdvertisementByID,
    updateAdvertisementByID,
} from '../../../src/services/model.service';
import { prismaClient } from '@atc/db';
import { updateAdvertisement } from '../../../src/handlers/updateAdvertisement';

// Mock all dependencies following the project pattern
jest.mock('@atc/common', () => ({
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
            UPDATED: 'Advertisement updated successfully',
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
jest.mock('@atc/db');

describe('updateAdvertisement', () => {
    let mockCall: jest.Mocked<CustomServerUnaryCall<UpdateAdvertisementRequest__Output, DefaultResponse>>;
    let mockCallback: jest.MockedFunction<sendUnaryData<DefaultResponse__Output>>;
    let mockGetAdvertisementByID: jest.MockedFunction<typeof getAdvertisementByID>;
    let mockUpdateAdvertisementByID: jest.MockedFunction<typeof updateAdvertisementByID>;
    let mockPrismaClient: jest.Mocked<typeof prismaClient>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mocks
        mockGetAdvertisementByID = getAdvertisementByID as jest.MockedFunction<typeof getAdvertisementByID>;
        mockUpdateAdvertisementByID = updateAdvertisementByID as jest.MockedFunction<typeof updateAdvertisementByID>;
        mockPrismaClient = prismaClient as jest.Mocked<typeof prismaClient>;

        // Mock call object with default request
        mockCall = {
            request: {
                advertisement_id: 'ad-123',
                title: 'Updated Advertisement Title',
                retailer_id: 'retailer-456',
                advertisement_type: 'BANNER',
                start_date: '2024-06-01T00:00:00Z',
                end_date: '2024-08-31T23:59:59Z',
                keyword: 'summer electronics',
            },
        } as any;

        // Mock callback function
        mockCallback = jest.fn();

        // Default mock implementations
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation((obj) => obj);

        // Mock prisma client
        mockPrismaClient.Prisma = {
            AdvertisementUpdateInput: {} as any,
        } as any;
    });

    describe('Successful Operations', () => {
        it('should successfully update advertisement with all fields', async () => {
            // Arrange
            const mockExistingAdvertisement = {
                id: 'ad-123',
                title: 'Original Title',
                retailer_id: 'retailer-123',
                advertisement_type: 'POPUP',
                start_date: '2024-01-01T00:00:00Z',
                end_date: '2024-12-31T23:59:59Z',
                keyword: 'old keyword',
                created_at: '2024-01-01T10:00:00Z',
                updated_at: '2024-01-01T10:00:00Z',
            };

            const mockGetResult = {
                advertisement: mockExistingAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(mockGetAdvertisementByID).toHaveBeenCalledWith('ad-123');
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                keyword: 'summer electronics',
                title: 'Updated Advertisement Title',
                Retailer: {
                    connect: {
                        id: 'retailer-456',
                    },
                },
                advertisement_type: 'BANNER',
                start_date: '2024-06-01T00:00:00Z',
                end_date: '2024-08-31T23:59:59Z',
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement updated successfully',
                status: status.OK,
            });
        });

        it('should successfully update advertisement with partial fields', async () => {
            // Arrange
            mockCall.request = {
                advertisement_id: 'ad-partial',
                title: 'Only Title Update',
            } as any;

            const mockExistingAdvertisement = {
                id: 'ad-partial',
                title: 'Original Title',
                retailer_id: 'retailer-existing',
                advertisement_type: 'VIDEO',
            };

            const mockGetResult = {
                advertisement: mockExistingAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-partial', {
                keyword: null, // Always set to null when not provided
                title: 'Only Title Update',
                // Other fields should not be included when not provided
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement updated successfully',
                status: status.OK,
            });
        });

        it('should handle keyword field correctly', async () => {
            // Test different keyword scenarios
            const keywordTestCases = [
                {
                    keyword: 'electronics sale',
                    expected: 'electronics sale',
                    description: 'with keyword',
                },
                {
                    keyword: '',
                    expected: null,
                    description: 'with empty string keyword',
                },
                {
                    keyword: undefined,
                    expected: null,
                    description: 'with undefined keyword',
                },
            ];

            for (const testCase of keywordTestCases) {
                jest.clearAllMocks();

                mockCall.request = {
                    advertisement_id: 'ad-keyword-test',
                    keyword: testCase.keyword,
                } as any;

                const mockExistingAdvertisement = {
                    id: 'ad-keyword-test',
                    title: 'Keyword Test Ad',
                };

                const mockGetResult = {
                    advertisement: mockExistingAdvertisement,
                };

                mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
                mockUpdateAdvertisementByID.mockResolvedValue(undefined);

                // Act
                await updateAdvertisement(mockCall, mockCallback);

                // Assert
                expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-keyword-test', {
                    keyword: testCase.expected,
                });
            }
        });

        it('should handle retailer connection correctly', async () => {
            // Arrange
            mockCall.request = {
                advertisement_id: 'ad-retailer-test',
                retailer_id: 'new-retailer-789',
            } as any;

            const mockExistingAdvertisement = {
                id: 'ad-retailer-test',
                title: 'Retailer Test Ad',
                retailer_id: 'old-retailer-123',
            };

            const mockGetResult = {
                advertisement: mockExistingAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-retailer-test', {
                keyword: null,
                Retailer: {
                    connect: {
                        id: 'new-retailer-789',
                    },
                },
            });
        });

        it('should properly clean request fields using utilFns.removeEmptyFields', async () => {
            // Arrange
            const requestWithEmptyFields = {
                advertisement_id: 'ad-clean',
                title: 'Clean Test Title',
                retailer_id: 'retailer-clean',
                keyword: 'clean keyword',
                empty_field: '',
                null_field: null,
                undefined_field: undefined,
            };

            const cleanedRequest = {
                advertisement_id: 'ad-clean',
                title: 'Clean Test Title',
                retailer_id: 'retailer-clean',
                keyword: 'clean keyword',
            };

            mockCall.request = requestWithEmptyFields as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const mockExistingAdvertisement = {
                id: 'ad-clean',
                title: 'Original Clean Title',
            };

            const mockGetResult = {
                advertisement: mockExistingAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-clean', {
                keyword: 'clean keyword',
                title: 'Clean Test Title',
                Retailer: {
                    connect: {
                        id: 'retailer-clean',
                    },
                },
            });
        });
    });

    describe('Update Data Construction', () => {
        it('should construct update data with only provided fields', async () => {
            // Test that only provided fields are included in update data
            const fieldsTestCases = [
                {
                    request: { advertisement_id: 'ad-1', title: 'New Title' },
                    expectedUpdate: { keyword: null, title: 'New Title' },
                    description: 'title only',
                },
                {
                    request: { advertisement_id: 'ad-2', advertisement_type: 'EMAIL' },
                    expectedUpdate: { keyword: null, advertisement_type: 'EMAIL' },
                    description: 'advertisement_type only',
                },
                {
                    request: { advertisement_id: 'ad-3', start_date: '2024-01-01T00:00:00Z' },
                    expectedUpdate: { keyword: null, start_date: '2024-01-01T00:00:00Z' },
                    description: 'start_date only',
                },
                {
                    request: { advertisement_id: 'ad-4', end_date: '2024-12-31T23:59:59Z' },
                    expectedUpdate: { keyword: null, end_date: '2024-12-31T23:59:59Z' },
                    description: 'end_date only',
                },
            ];

            for (const testCase of fieldsTestCases) {
                jest.clearAllMocks();

                mockCall.request = testCase.request as any;

                const mockExistingAdvertisement = {
                    id: testCase.request.advertisement_id,
                    title: 'Existing Title',
                };

                const mockGetResult = {
                    advertisement: mockExistingAdvertisement,
                };

                mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
                mockUpdateAdvertisementByID.mockResolvedValue(undefined);

                // Act
                await updateAdvertisement(mockCall, mockCallback);

                // Assert
                expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith(
                    testCase.request.advertisement_id,
                    testCase.expectedUpdate
                );
            }
        });

        it('should always include keyword field in update data', async () => {
            // Test that keyword is always included, even when not provided
            mockCall.request = {
                advertisement_id: 'ad-keyword-always',
                title: 'Test Title',
                // keyword not provided
            } as any;

            const mockExistingAdvertisement = {
                id: 'ad-keyword-always',
                title: 'Existing Title',
            };

            const mockGetResult = {
                advertisement: mockExistingAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            const updateCall = mockUpdateAdvertisementByID.mock.calls[0];
            const updateData = updateCall[1];
            
            expect(updateData).toHaveProperty('keyword', null);
            expect(updateData).toHaveProperty('title', 'Test Title');
        });

        it('should handle date fields with proper ISO string format', async () => {
            // Arrange
            const isoStartDate = '2024-07-01T09:00:00.000Z';
            const isoEndDate = '2024-09-30T18:00:00.000Z';

            mockCall.request = {
                advertisement_id: 'ad-dates',
                start_date: isoStartDate,
                end_date: isoEndDate,
            } as any;

            const mockExistingAdvertisement = {
                id: 'ad-dates',
                title: 'Date Test Ad',
            };

            const mockGetResult = {
                advertisement: mockExistingAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-dates', {
                keyword: null,
                start_date: isoStartDate,
                end_date: isoEndDate,
            });
        });
    });

    describe('Error Handling', () => {
        it('should return NOT_FOUND when advertisement does not exist', async () => {
            // Arrange
            const mockGetResult = {
                advertisement: null,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementByID).toHaveBeenCalledWith('ad-123');
            expect(mockUpdateAdvertisementByID).not.toHaveBeenCalled();
            
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement not found',
                status: status.NOT_FOUND,
            });
        });

        it('should return NOT_FOUND when advertisement is undefined', async () => {
            // Arrange
            const mockGetResult = {
                advertisement: undefined,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockUpdateAdvertisementByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement not found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle getAdvertisementByID service error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            mockGetAdvertisementByID.mockRejectedValue(mockError);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockUpdateAdvertisementByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle updateAdvertisementByID service error', async () => {
            // Arrange
            const mockExistingAdvertisement = {
                id: 'ad-update-error',
                title: 'Update Error Ad',
            };

            const mockGetResult = {
                advertisement: mockExistingAdvertisement,
            };

            const mockUpdateError = new Error('Update operation failed');

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockRejectedValue(mockUpdateError);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementByID).toHaveBeenCalledWith('ad-123');
            expect(mockUpdateAdvertisementByID).toHaveBeenCalled();
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
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockGetAdvertisementByID).not.toHaveBeenCalled();
            expect(mockUpdateAdvertisementByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle malformed service response', async () => {
            // Arrange
            // Service returns malformed response without advertisement property
            mockGetAdvertisementByID.mockResolvedValue({} as any);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockUpdateAdvertisementByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement not found',
                status: status.NOT_FOUND,
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing advertisement_id in request', async () => {
            // Arrange
            const requestWithoutId = {
                title: 'Update without ID',
            };

            const cleanedRequest = {
                title: 'Update without ID',
            };

            mockCall.request = requestWithoutId as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const mockGetResult = {
                advertisement: null,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementByID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement not found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle empty string advertisement_id', async () => {
            // Arrange
            mockCall.request = {
                advertisement_id: '',
                title: 'Empty ID Update',
            } as any;

            const mockGetResult = {
                advertisement: null,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementByID).toHaveBeenCalledWith('');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement not found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle very long advertisement_id', async () => {
            // Arrange
            const longAdId = 'a'.repeat(1000);
            mockCall.request = {
                advertisement_id: longAdId,
                title: 'Long ID Update',
            } as any;

            const mockGetResult = {
                advertisement: null,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementByID).toHaveBeenCalledWith(longAdId);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement not found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle update with special characters and unicode', async () => {
            // Arrange
            mockCall.request = {
                advertisement_id: 'ad-unicode',
                title: 'Spéçiál Advërtisemënt Títlë with Émojis 🎯📱',
                keyword: 'ünicödé këywörds & spëçiál çharaçtërs',
            } as any;

            const mockExistingAdvertisement = {
                id: 'ad-unicode',
                title: 'Original Unicode Title',
            };

            const mockGetResult = {
                advertisement: mockExistingAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-unicode', {
                keyword: 'ünicödé këywörds & spëçiál çharaçtërs',
                title: 'Spéçiál Advërtisemënt Títlë with Émojis 🎯📱',
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement updated successfully',
                status: status.OK,
            });
        });

        it('should handle update with null/undefined field values', async () => {
            // Arrange
            mockCall.request = {
                advertisement_id: 'ad-null-values',
                title: null,
                retailer_id: undefined,
                advertisement_type: '',
                keyword: null,
            } as any;

            const mockExistingAdvertisement = {
                id: 'ad-null-values',
                title: 'Existing Title',
            };

            const mockGetResult = {
                advertisement: mockExistingAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            const updateCall = mockUpdateAdvertisementByID.mock.calls[0];
            const updateData = updateCall[1];
            
            // Should only include fields that are truthy (non-null, non-undefined, non-empty)
            expect(updateData).toEqual({
                keyword: null, // Always included
                // title, retailer_id, advertisement_type should not be included as they are falsy
            });
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle complete workflow with realistic data', async () => {
            // Arrange
            const realisticRequest = {
                advertisement_id: 'summer-electronics-sale-2024',
                title: 'Summer Electronics Mega Sale 2024 - Updated',
                retailer_id: 'electronics-superstore-premium',
                advertisement_type: 'VIDEO',
                start_date: '2024-07-01T00:00:00.000Z',
                end_date: '2024-09-30T23:59:59.999Z',
                keyword: 'summer electronics sale smartphones laptops deals',
                extra_param: 'should_be_removed',
                empty_string: '',
            };

            const cleanedRequest = {
                advertisement_id: 'summer-electronics-sale-2024',
                title: 'Summer Electronics Mega Sale 2024 - Updated',
                retailer_id: 'electronics-superstore-premium',
                advertisement_type: 'VIDEO',
                start_date: '2024-07-01T00:00:00.000Z',
                end_date: '2024-09-30T23:59:59.999Z',
                keyword: 'summer electronics sale smartphones laptops deals',
            };

            mockCall.request = realisticRequest as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const realisticExistingAdvertisement = {
                id: 'summer-electronics-sale-2024',
                title: 'Summer Electronics Sale 2024',
                retailer_id: 'electronics-superstore',
                advertisement_type: 'BANNER',
                start_date: '2024-06-01T00:00:00.000Z',
                end_date: '2024-08-31T23:59:59.999Z',
                keyword: 'electronics sale',
                advertisement_status: 'ACTIVE',
                match_percentage: 85,
                created_at: '2024-05-15T09:00:00.000Z',
                updated_at: '2024-06-01T14:30:00.000Z',
            };

            const mockGetResult = {
                advertisement: realisticExistingAdvertisement,
                metadata: {
                    total_items: 15,
                    match_score: 0.85,
                },
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(realisticRequest);
            expect(mockGetAdvertisementByID).toHaveBeenCalledWith('summer-electronics-sale-2024');
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('summer-electronics-sale-2024', {
                keyword: 'summer electronics sale smartphones laptops deals',
                title: 'Summer Electronics Mega Sale 2024 - Updated',
                Retailer: {
                    connect: {
                        id: 'electronics-superstore-premium',
                    },
                },
                advertisement_type: 'VIDEO',
                start_date: '2024-07-01T00:00:00.000Z',
                end_date: '2024-09-30T23:59:59.999Z',
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement updated successfully',
                status: status.OK,
            });
        });

        it('should handle partial update scenarios', async () => {
            // Test various partial update combinations
            const partialUpdateScenarios = [
                {
                    description: 'title and keyword only',
                    request: {
                        advertisement_id: 'ad-partial-1',
                        title: 'New Title Only',
                        keyword: 'new keywords',
                    },
                    expectedUpdate: {
                        keyword: 'new keywords',
                        title: 'New Title Only',
                    },
                },
                {
                    description: 'dates only',
                    request: {
                        advertisement_id: 'ad-partial-2',
                        start_date: '2024-01-01T00:00:00Z',
                        end_date: '2024-12-31T23:59:59Z',
                    },
                    expectedUpdate: {
                        keyword: null,
                        start_date: '2024-01-01T00:00:00Z',
                        end_date: '2024-12-31T23:59:59Z',
                    },
                },
                {
                    description: 'retailer and type only',
                    request: {
                        advertisement_id: 'ad-partial-3',
                        retailer_id: 'new-retailer',
                        advertisement_type: 'EMAIL',
                    },
                    expectedUpdate: {
                        keyword: null,
                        Retailer: {
                            connect: {
                                id: 'new-retailer',
                            },
                        },
                        advertisement_type: 'EMAIL',
                    },
                },
            ];

            for (const scenario of partialUpdateScenarios) {
                jest.clearAllMocks();

                mockCall.request = scenario.request as any;

                const mockExistingAdvertisement = {
                    id: scenario.request.advertisement_id,
                    title: 'Existing Title',
                    retailer_id: 'existing-retailer',
                    advertisement_type: 'BANNER',
                };

                const mockGetResult = {
                    advertisement: mockExistingAdvertisement,
                };

                mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
                mockUpdateAdvertisementByID.mockResolvedValue(undefined);

                // Act
                await updateAdvertisement(mockCall, mockCallback);

                // Assert
                expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith(
                    scenario.request.advertisement_id,
                    scenario.expectedUpdate
                );

                expect(mockCallback).toHaveBeenCalledWith(null, {
                    message: 'Advertisement updated successfully',
                    status: status.OK,
                });
            }
        });
    });

    describe('Service Layer Integration', () => {
        it('should call service functions in correct order', async () => {
            // Arrange
            const mockExistingAdvertisement = {
                id: 'order-test-ad',
                title: 'Order Test Ad',
            };

            const mockGetResult = {
                advertisement: mockExistingAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            // Verify the order of service calls
            const getAdCallOrder = mockGetAdvertisementByID.mock.invocationCallOrder[0];
            const updateAdCallOrder = mockUpdateAdvertisementByID.mock.invocationCallOrder[0];
            
            expect(getAdCallOrder).toBeLessThan(updateAdCallOrder);
        });

        it('should not call updateAdvertisementByID if advertisement validation fails', async () => {
            // Arrange
            const mockGetResult = {
                advertisement: null,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementByID).toHaveBeenCalled();
            expect(mockUpdateAdvertisementByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement not found',
                status: status.NOT_FOUND,
            });
        });

        it('should pass exact parameters to service functions', async () => {
            // Arrange
            const specificAdId = 'specific-test-ad-id-12345';

            mockCall.request = {
                advertisement_id: specificAdId,
                title: 'Specific Test Title',
                keyword: 'specific test keyword',
            } as any;

            const mockExistingAdvertisement = {
                id: specificAdId,
                title: 'Original Specific Title',
            };

            const mockGetResult = {
                advertisement: mockExistingAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementByID).toHaveBeenCalledWith(specificAdId);
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith(specificAdId, {
                keyword: 'specific test keyword',
                title: 'Specific Test Title',
            });
            
            // Verify exact parameter matching
            const getAdCall = mockGetAdvertisementByID.mock.calls[0];
            const updateAdCall = mockUpdateAdvertisementByID.mock.calls[0];
            
            expect(getAdCall[0]).toBe(specificAdId);
            expect(updateAdCall[0]).toBe(specificAdId);
        });

        it('should handle service function return values correctly', async () => {
            // Arrange
            const mockExistingAdvertisement = {
                id: 'return-value-test',
                title: 'Return Value Test Ad',
                additional_data: 'should_not_affect_flow',
            };

            const mockGetResult = {
                advertisement: mockExistingAdvertisement,
                metadata: 'extra_metadata',
            };

            // Test that return values are handled correctly
            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined); // Void return

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement updated successfully',
                status: status.OK,
            });
        });
    });

    describe('Prisma Update Data Structure', () => {
        it('should create correct Prisma connect structure for retailer', async () => {
            // Arrange
            mockCall.request = {
                advertisement_id: 'prisma-connect-test',
                retailer_id: 'retailer-connect-123',
            } as any;

            const mockExistingAdvertisement = {
                id: 'prisma-connect-test',
                title: 'Prisma Connect Test',
            };

            const mockGetResult = {
                advertisement: mockExistingAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            const updateCall = mockUpdateAdvertisementByID.mock.calls[0];
            const updateData = updateCall[1];

            expect(updateData).toHaveProperty('Retailer');
            expect(updateData.Retailer).toEqual({
                connect: {
                    id: 'retailer-connect-123',
                },
            });
        });

        it('should create proper update data structure for all field types', async () => {
            // Arrange
            const allFieldsRequest = {
                advertisement_id: 'all-fields-test',
                title: 'All Fields Test Title',
                retailer_id: 'all-fields-retailer',
                advertisement_type: 'SOCIAL_MEDIA',
                start_date: '2024-01-01T00:00:00Z',
                end_date: '2024-12-31T23:59:59Z',
                keyword: 'all fields keyword',
            };

            mockCall.request = allFieldsRequest as any;

            const mockExistingAdvertisement = {
                id: 'all-fields-test',
                title: 'Original Title',
            };

            const mockGetResult = {
                advertisement: mockExistingAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await updateAdvertisement(mockCall, mockCallback);

            // Assert
            const updateCall = mockUpdateAdvertisementByID.mock.calls[0];
            const updateData = updateCall[1];

            // Verify structure matches Prisma AdvertisementUpdateInput
            expect(updateData).toEqual({
                keyword: 'all fields keyword',
                title: 'All Fields Test Title',
                Retailer: {
                    connect: {
                        id: 'all-fields-retailer',
                    },
                },
                advertisement_type: 'SOCIAL_MEDIA',
                start_date: '2024-01-01T00:00:00Z',
                end_date: '2024-12-31T23:59:59Z',
            });

            // Verify no extra properties
            const allowedProperties = ['keyword', 'title', 'Retailer', 'advertisement_type', 'start_date', 'end_date'];
            Object.keys(updateData).forEach(key => {
                expect(allowedProperties).toContain(key);
            });
        });

        it('should handle conditional field inclusion correctly', async () => {
            // Test that fields are only included when they have truthy values
            const conditionalTestCases = [
                {
                    request: { advertisement_id: 'cond-1', title: 'Valid Title' },
                    shouldIncludeTitle: true,
                },
                {
                    request: { advertisement_id: 'cond-2', title: '' },
                    shouldIncludeTitle: false,
                },
                {
                    request: { advertisement_id: 'cond-3', title: null },
                    shouldIncludeTitle: false,
                },
                {
                    request: { advertisement_id: 'cond-4', title: undefined },
                    shouldIncludeTitle: false,
                },
                {
                    request: { advertisement_id: 'cond-5', retailer_id: 'valid-retailer' },
                    shouldIncludeRetailer: true,
                },
                {
                    request: { advertisement_id: 'cond-6', retailer_id: '' },
                    shouldIncludeRetailer: false,
                },
            ];

            for (const testCase of conditionalTestCases) {
                jest.clearAllMocks();

                mockCall.request = testCase.request as any;

                const mockExistingAdvertisement = {
                    id: testCase.request.advertisement_id,
                    title: 'Existing Title',
                };

                const mockGetResult = {
                    advertisement: mockExistingAdvertisement,
                };

                mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
                mockUpdateAdvertisementByID.mockResolvedValue(undefined);

                // Act
                await updateAdvertisement(mockCall, mockCallback);

                // Assert
                const updateCall = mockUpdateAdvertisementByID.mock.calls[0];
                const updateData = updateCall[1];

                if (testCase.shouldIncludeTitle !== undefined) {
                    if (testCase.shouldIncludeTitle) {
                        expect(updateData).toHaveProperty('title');
                    } else {
                        expect(updateData).not.toHaveProperty('title');
                    }
                }

                if (testCase.shouldIncludeRetailer !== undefined) {
                    if (testCase.shouldIncludeRetailer) {
                        expect(updateData).toHaveProperty('Retailer');
                    } else {
                        expect(updateData).not.toHaveProperty('Retailer');
                    }
                }

                // keyword should always be present
                expect(updateData).toHaveProperty('keyword');
            }
        });
    });

    describe('Field-Specific Behavior', () => {
        it('should handle keyword field with special null behavior', async () => {
            // Test that keyword is set to null when not provided or falsy
            const keywordBehaviorCases = [
                {
                    keyword: 'valid keyword',
                    expected: 'valid keyword',
                    description: 'valid keyword string',
                },
                {
                    keyword: '',
                    expected: null,
                    description: 'empty string',
                },
                {
                    keyword: null,
                    expected: null,
                    description: 'explicit null',
                },
                {
                    keyword: undefined,
                    expected: null,
                    description: 'undefined',
                },
                {
                    // keyword not provided in request
                    expected: null,
                    description: 'not provided',
                },
            ];

            for (const testCase of keywordBehaviorCases) {
                jest.clearAllMocks();

                const request: any = {
                    advertisement_id: 'keyword-behavior-test',
                };

                if (testCase.hasOwnProperty('keyword')) {
                    request.keyword = testCase.keyword;
                }

                mockCall.request = request;

                const mockExistingAdvertisement = {
                    id: 'keyword-behavior-test',
                    title: 'Keyword Behavior Test',
                };

                const mockGetResult = {
                    advertisement: mockExistingAdvertisement,
                };

                mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
                mockUpdateAdvertisementByID.mockResolvedValue(undefined);

                // Act
                await updateAdvertisement(mockCall, mockCallback);

                // Assert
                const updateCall = mockUpdateAdvertisementByID.mock.calls[0];
                const updateData = updateCall[1];

                expect(updateData).toHaveProperty('keyword', testCase.expected);
            }
        });

        it('should handle date fields with various formats', async () => {
            // Test different date formats and edge cases
            const dateTestCases = [
                {
                    start_date: '2024-01-01T00:00:00Z',
                    end_date: '2024-12-31T23:59:59Z',
                    description: 'ISO strings with Z',
                },
                {
                    start_date: '2024-01-01T00:00:00.000Z',
                    end_date: '2024-12-31T23:59:59.999Z',
                    description: 'ISO strings with milliseconds',
                },
                {
                    start_date: '2024-06-15T14:30:45.123Z',
                    end_date: '2024-08-20T18:45:30.456Z',
                    description: 'Complex ISO timestamps',
                },
            ];

            for (const testCase of dateTestCases) {
                jest.clearAllMocks();

                mockCall.request = {
                    advertisement_id: 'date-format-test',
                    start_date: testCase.start_date,
                    end_date: testCase.end_date,
                } as any;

                const mockExistingAdvertisement = {
                    id: 'date-format-test',
                    title: 'Date Format Test',
                };

                const mockGetResult = {
                    advertisement: mockExistingAdvertisement,
                };

                mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
                mockUpdateAdvertisementByID.mockResolvedValue(undefined);

                // Act
                await updateAdvertisement(mockCall, mockCallback);

                // Assert
                const updateCall = mockUpdateAdvertisementByID.mock.calls[0];
                const updateData = updateCall[1];

                expect(updateData).toHaveProperty('start_date', testCase.start_date);
                expect(updateData).toHaveProperty('end_date', testCase.end_date);
            }
        });

        it('should handle advertisement_type field with various values', async () => {
            // Test different advertisement types
            const adTypeTestCases = [
                'BANNER',
                'POPUP',
                'VIDEO',
                'EMAIL',
                'SOCIAL_MEDIA',
                'DISPLAY',
                'NATIVE',
            ];

            for (const adType of adTypeTestCases) {
                jest.clearAllMocks();

                mockCall.request = {
                    advertisement_id: 'ad-type-test',
                    advertisement_type: adType,
                } as any;

                const mockExistingAdvertisement = {
                    id: 'ad-type-test',
                    title: 'Ad Type Test',
                };

                const mockGetResult = {
                    advertisement: mockExistingAdvertisement,
                };

                mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
                mockUpdateAdvertisementByID.mockResolvedValue(undefined);

                // Act
                await updateAdvertisement(mockCall, mockCallback);

                // Assert
                const updateCall = mockUpdateAdvertisementByID.mock.calls[0];
                const updateData = updateCall[1];

                expect(updateData).toHaveProperty('advertisement_type', adType);
            }
        });
    });
});