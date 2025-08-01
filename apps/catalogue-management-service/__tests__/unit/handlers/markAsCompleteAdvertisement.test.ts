import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DefaultResponse,
    DefaultResponse__Output,
    MarkAsCompleteAdvertisementRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getAdvertisementByID,
    updateAdvertisementByID,
} from '../../../src/services/model.service';
import { prismaClient } from '@atc/db';
import { markAsCompleteAdvertisement } from '../../../src/handlers/markAsCompleteAdvertisement';

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
            ADVERTISEMENT_COMPLETED: 'Advertisement marked as complete successfully',
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

describe('markAsCompleteAdvertisement', () => {
    let mockCall: jest.Mocked<CustomServerUnaryCall<MarkAsCompleteAdvertisementRequest__Output, DefaultResponse>>;
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
            },
        } as any;

        // Mock callback function
        mockCallback = jest.fn();

        // Default mock implementations
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation((obj) => obj);

        // Mock prisma client enums
        mockPrismaClient.AdvertisementStatus = {
            PENDING: 'PENDING',
            IN_PROGRESS: 'IN_PROGRESS',
            COMPLETED: 'COMPLETED',
            CANCELLED: 'CANCELLED',
        } as any;
    });

    describe('Successful Operations', () => {
        it('should successfully mark advertisement as complete', async () => {
            // Arrange
            const mockAdvertisement = {
                id: 'ad-123',
                title: 'Test Advertisement',
                advertisement_status: 'IN_PROGRESS',
                match_percentage: 75,
                created_at: '2024-01-15T10:00:00Z',
                updated_at: '2024-01-15T11:00:00Z',
            };

            const mockGetResult = {
                advertisement: mockAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await markAsCompleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(mockGetAdvertisementByID).toHaveBeenCalledWith('ad-123');
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 100,
                advertisement_status: 'COMPLETED',
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement marked as complete successfully',
                status: status.OK,
            });
        });

        it('should successfully mark advertisement as complete with different initial status', async () => {
            // Arrange
            const mockAdvertisement = {
                id: 'ad-pending',
                title: 'Pending Advertisement',
                advertisement_status: 'PENDING',
                match_percentage: 0,
            };

            const mockGetResult = {
                advertisement: mockAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await markAsCompleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 100,
                advertisement_status: 'COMPLETED',
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement marked as complete successfully',
                status: status.OK,
            });
        });

        it('should successfully mark already high percentage advertisement as complete', async () => {
            // Arrange
            const mockAdvertisement = {
                id: 'ad-high-percentage',
                title: 'High Percentage Advertisement',
                advertisement_status: 'IN_PROGRESS',
                match_percentage: 95, // Already high percentage
            };

            const mockGetResult = {
                advertisement: mockAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await markAsCompleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 100, // Should still be set to 100
                advertisement_status: 'COMPLETED',
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement marked as complete successfully',
                status: status.OK,
            });
        });

        it('should properly clean request fields using utilFns.removeEmptyFields', async () => {
            // Arrange
            const requestWithEmptyFields = {
                advertisement_id: 'ad-clean-test',
                empty_field: '',
                null_field: null,
                undefined_field: undefined,
            };

            const cleanedRequest = {
                advertisement_id: 'ad-clean-test',
            };

            mockCall.request = requestWithEmptyFields as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const mockAdvertisement = {
                id: 'ad-clean-test',
                title: 'Clean Test Advertisement',
                advertisement_status: 'PENDING',
                match_percentage: 50,
            };

            const mockGetResult = {
                advertisement: mockAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await markAsCompleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(mockGetAdvertisementByID).toHaveBeenCalledWith('ad-clean-test');
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-clean-test', {
                match_percentage: 100,
                advertisement_status: 'COMPLETED',
            });
        });
    });

    describe('Business Logic Validation', () => {
        it('should always set match_percentage to 100 regardless of current value', async () => {
            // Arrange
            const testCases = [
                { currentPercentage: 0, description: 'zero percentage' },
                { currentPercentage: 25, description: 'low percentage' },
                { currentPercentage: 50, description: 'medium percentage' },
                { currentPercentage: 75, description: 'high percentage' },
                { currentPercentage: 99, description: 'very high percentage' },
                { currentPercentage: 100, description: 'already complete percentage' },
            ];

            for (const testCase of testCases) {
                jest.clearAllMocks();

                const mockAdvertisement = {
                    id: `ad-${testCase.currentPercentage}`,
                    title: `${testCase.description} Advertisement`,
                    advertisement_status: 'IN_PROGRESS',
                    match_percentage: testCase.currentPercentage,
                };

                const mockGetResult = {
                    advertisement: mockAdvertisement,
                };

                mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
                mockUpdateAdvertisementByID.mockResolvedValue(undefined);

                // Act
                await markAsCompleteAdvertisement(mockCall, mockCallback);

                // Assert
                expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                    match_percentage: 100, // Should always be 100
                    advertisement_status: 'COMPLETED',
                });
            }
        });

        it('should always set status to COMPLETED regardless of current status', async () => {
            // Arrange
            const testCases = [
                { currentStatus: 'PENDING', description: 'pending' },
                { currentStatus: 'IN_PROGRESS', description: 'in progress' },
                { currentStatus: 'CANCELLED', description: 'cancelled' },
                { currentStatus: 'COMPLETED', description: 'already completed' },
            ];

            for (const testCase of testCases) {
                jest.clearAllMocks();

                const mockAdvertisement = {
                    id: `ad-${testCase.currentStatus.toLowerCase()}`,
                    title: `${testCase.description} Advertisement`,
                    advertisement_status: testCase.currentStatus,
                    match_percentage: 75,
                };

                const mockGetResult = {
                    advertisement: mockAdvertisement,
                };

                mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
                mockUpdateAdvertisementByID.mockResolvedValue(undefined);

                // Act
                await markAsCompleteAdvertisement(mockCall, mockCallback);

                // Assert
                expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                    match_percentage: 100,
                    advertisement_status: 'COMPLETED', // Should always be COMPLETED
                });
            }
        });

        it('should use correct prisma enum value for COMPLETED status', async () => {
            // Arrange
            const mockAdvertisement = {
                id: 'ad-enum-test',
                title: 'Enum Test Advertisement',
                advertisement_status: 'PENDING',
                match_percentage: 50,
            };

            const mockGetResult = {
                advertisement: mockAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await markAsCompleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 100,
                advertisement_status: mockPrismaClient.AdvertisementStatus.COMPLETED,
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
            await markAsCompleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementByID).toHaveBeenCalledWith('ad-123');
            expect(mockUpdateAdvertisementByID).not.toHaveBeenCalled();
            
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement not found',
                status: status.NOT_FOUND,
            });
        });

        it('should return NOT_FOUND when getAdvertisementByID returns undefined advertisement', async () => {
            // Arrange
            const mockGetResult = {
                advertisement: undefined,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);

            // Act
            await markAsCompleteAdvertisement(mockCall, mockCallback);

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
            await markAsCompleteAdvertisement(mockCall, mockCallback);

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
            const mockAdvertisement = {
                id: 'ad-update-error',
                title: 'Update Error Advertisement',
                advertisement_status: 'IN_PROGRESS',
                match_percentage: 75,
            };

            const mockGetResult = {
                advertisement: mockAdvertisement,
            };

            const mockUpdateError = new Error('Update operation failed');

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockRejectedValue(mockUpdateError);

            // Act
            await markAsCompleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementByID).toHaveBeenCalledWith('ad-123');
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 100,
                advertisement_status: 'COMPLETED',
            });
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
            await markAsCompleteAdvertisement(mockCall, mockCallback);

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
            await markAsCompleteAdvertisement(mockCall, mockCallback);

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
            const requestWithoutId = {};
            const cleanedRequest = {};

            mockCall.request = requestWithoutId as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const mockGetResult = {
                advertisement: null,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);

            // Act
            await markAsCompleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementByID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement not found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle empty string advertisement_id', async () => {
            // Arrange
            mockCall.request = { advertisement_id: '' } as any;

            const mockGetResult = {
                advertisement: null,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);

            // Act
            await markAsCompleteAdvertisement(mockCall, mockCallback);

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
            mockCall.request = { advertisement_id: longAdId } as any;

            const mockGetResult = {
                advertisement: null,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);

            // Act
            await markAsCompleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementByID).toHaveBeenCalledWith(longAdId);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement not found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle advertisement with special characters in data', async () => {
            // Arrange
            const mockAdvertisement = {
                id: 'ad-special-chars',
                title: 'Spéçiál Advërtisemënt with Émojis 🎯',
                description: 'Çömplex ünïcødé text & symbols',
                advertisement_status: 'IN_PROGRESS',
                match_percentage: 80,
            };

            const mockGetResult = {
                advertisement: mockAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await markAsCompleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 100,
                advertisement_status: 'COMPLETED',
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement marked as complete successfully',
                status: status.OK,
            });
        });

        it('should handle advertisement with null/undefined properties', async () => {
            // Arrange
            const mockAdvertisement = {
                id: 'ad-null-props',
                title: null,
                description: undefined,
                advertisement_status: 'PENDING',
                match_percentage: null,
                created_at: null,
                updated_at: undefined,
            };

            const mockGetResult = {
                advertisement: mockAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await markAsCompleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 100, // Should still set to 100 even if current is null
                advertisement_status: 'COMPLETED',
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement marked as complete successfully',
                status: status.OK,
            });
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle complete workflow with realistic data', async () => {
            // Arrange
            const realisticRequest = {
                advertisement_id: 'summer-electronics-banner-2024',
                extra_param: 'should_be_removed',
                empty_string: '',
            };

            const cleanedRequest = {
                advertisement_id: 'summer-electronics-banner-2024',
            };

            mockCall.request = realisticRequest as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const realisticAdvertisement = {
                id: 'summer-electronics-banner-2024',
                title: 'Summer Electronics Sale 2024',
                description: 'Amazing deals on electronics this summer',
                advertisement_type: 'BANNER',
                start_date: '2024-06-01T00:00:00Z',
                end_date: '2024-08-31T23:59:59Z',
                advertisement_status: 'IN_PROGRESS',
                match_percentage: 85,
                retailer_id: 'electronics-superstore',
                created_at: '2024-05-15T09:00:00Z',
                updated_at: '2024-06-15T14:30:00Z',
                analytics: {
                    views: 50000,
                    clicks: 2500,
                    conversions: 125,
                },
            };

            const mockGetResult = {
                advertisement: realisticAdvertisement,
                totalProducts: 15,
                metadata: {
                    lastModified: '2024-06-15T14:30:00Z',
                    version: 3,
                },
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await markAsCompleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(realisticRequest);
            expect(mockGetAdvertisementByID).toHaveBeenCalledWith('summer-electronics-banner-2024');
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('summer-electronics-banner-2024', {
                match_percentage: 100,
                advertisement_status: 'COMPLETED',
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement marked as complete successfully',
                status: status.OK,
            });
        });

        it('should handle idempotent operation - marking already completed advertisement', async () => {
            // Arrange
            const alreadyCompletedAdvertisement = {
                id: 'ad-already-complete',
                title: 'Already Completed Advertisement',
                advertisement_status: 'COMPLETED',
                match_percentage: 100,
                completed_at: '2024-06-01T10:00:00Z',
            };

            const mockGetResult = {
                advertisement: alreadyCompletedAdvertisement,
            };

            mockGetAdvertisementByID.mockResolvedValue(mockGetResult);
            mockUpdateAdvertisementByID.mockResolvedValue(undefined);

            // Act
            await markAsCompleteAdvertisement(mockCall, mockCallback);

            // Assert
            // Should still perform the update operation (idempotent)
            expect(mockUpdateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 100,
                advertisement_status: 'COMPLETED',
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement marked as complete successfully',
                status: status.OK,
            });
        });
    });
});