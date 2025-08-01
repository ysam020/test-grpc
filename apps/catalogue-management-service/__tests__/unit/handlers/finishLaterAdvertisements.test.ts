import { status } from '@grpc/grpc-js';

// Mock business logic dependencies BEFORE importing the handler
jest.mock('@atc/common', () => ({
    errorMessage: {
        ADVERTISEMENT: {
            NOT_FOUND: 'Advertisement Not Found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something Went Wrong',
        },
    },
    responseMessage: {
        ADVERTISEMENT: {
            FINISHED_LATER: 'Advertisement Finished Later successfully',
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

jest.mock('@atc/db', () => ({
    prismaClient: {
        AdvertisementStatus: {
            COMPLETED: 'COMPLETED',
            NEEDS_REVIEW: 'NEEDS_REVIEW',
        },
    },
}));

jest.mock('../../../src/services/model.service', () => ({
    getAdvertisementByID: jest.fn(),
    updateAdvertisementByID: jest.fn(),
}));

// Import after mocks
import { finishLaterAdvertisement } from '../../../src/handlers/finishLaterAdvertisement';
import {
    getAdvertisementByID,
    updateAdvertisementByID,
} from '../../../src/services/model.service';
import { utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { prismaClient } from '@atc/db';

describe('finishLaterAdvertisement Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        
        mockCall = {
            request: {
                advertisement_id: 'ad-123',
            },
        };

        // Setup default mock implementations
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation((data) => data);
    });

    describe('Successful scenarios', () => {
        it('should successfully finish advertisement later with 100% match (COMPLETED status)', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'ad-123',
                    title: 'Complete Advertisement',
                    advertisement_status: 'NEEDS_REVIEW',
                },
                matchSummary: {
                    total_items: '10',
                    matched_items: '10',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(getAdvertisementByID).toHaveBeenCalledWith('ad-123');
            expect(updateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 100,
                advertisement_status: 'COMPLETED',
            });
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Finished Later successfully',
                status: status.OK,
            });
        });

        it('should successfully finish advertisement later with partial match (NEEDS_REVIEW status)', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'ad-123',
                    title: 'Partial Advertisement',
                    advertisement_status: 'NEEDS_REVIEW',
                },
                matchSummary: {
                    total_items: '20',
                    matched_items: '15',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(updateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 75, // 15/20 * 100 = 75%
                advertisement_status: 'NEEDS_REVIEW',
            });
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Finished Later successfully',
                status: status.OK,
            });
        });

        it('should handle zero matched items (0% match)', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'ad-123',
                    title: 'No Matches Advertisement',
                },
                matchSummary: {
                    total_items: '5',
                    matched_items: '0',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(updateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 0,
                advertisement_status: 'NEEDS_REVIEW',
            });
        });

        it('should handle zero total items (0% match with division by zero prevention)', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'ad-123',
                    title: 'Empty Advertisement',
                },
                matchSummary: {
                    total_items: '0',
                    matched_items: '0',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(updateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 0, // Handles division by zero
                advertisement_status: 'NEEDS_REVIEW',
            });
        });

        it('should handle null matchSummary (defaults to 0)', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'ad-123',
                    title: 'No Summary Advertisement',
                },
                matchSummary: null,
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(updateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 0,
                advertisement_status: 'NEEDS_REVIEW',
            });
        });

        it('should handle undefined matchSummary (defaults to 0)', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'ad-123',
                    title: 'Undefined Summary Advertisement',
                },
                matchSummary: undefined,
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(updateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 0,
                advertisement_status: 'NEEDS_REVIEW',
            });
        });

        it('should call utilFns.removeEmptyFields to clean request data', async () => {
            // Arrange
            const requestWithEmptyFields = {
                advertisement_id: 'ad-123',
                extra_field: '',
                another_field: null,
            };

            const cleanedRequest = {
                advertisement_id: 'ad-123',
            };

            mockCall.request = requestWithEmptyFields;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const mockAdvertisementResponse = {
                advertisement: { id: 'ad-123', title: 'Clean Advertisement' },
                matchSummary: { total_items: '1', matched_items: '1' },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(getAdvertisementByID).toHaveBeenCalledWith('ad-123');
        });
    });

    describe('Error scenarios', () => {
        it('should return NOT_FOUND when advertisement does not exist', async () => {
            // Arrange
            const mockEmptyResponse = {
                advertisement: null,
                matchSummary: null,
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockEmptyResponse);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(getAdvertisementByID).toHaveBeenCalledWith('ad-123');
            expect(updateAdvertisementByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should return NOT_FOUND when advertisement is undefined', async () => {
            // Arrange
            const mockUndefinedResponse = {
                advertisement: undefined,
                matchSummary: undefined,
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockUndefinedResponse);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(updateAdvertisementByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should return INTERNAL error when getAdvertisementByID throws an error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            (getAdvertisementByID as jest.Mock).mockRejectedValue(mockError);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(updateAdvertisementByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should return INTERNAL error when updateAdvertisementByID throws an error', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: { id: 'ad-123', title: 'Update Error Advertisement' },
                matchSummary: { total_items: '10', matched_items: '5' },
            };
            const mockError = new Error('Update operation failed');

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockRejectedValue(mockError);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

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
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(getAdvertisementByID).not.toHaveBeenCalled();
            expect(updateAdvertisementByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });
    });

    describe('Match percentage calculation', () => {
        it('should calculate correct percentage for various match ratios', async () => {
            // Test cases for different percentage calculations
            const testCases = [
                { total: '10', matched: '10', expectedPercentage: 100 }, // 100%
                { total: '10', matched: '5', expectedPercentage: 50 },   // 50%
                { total: '3', matched: '1', expectedPercentage: 33 },    // 33.33% rounded to 33
                { total: '3', matched: '2', expectedPercentage: 67 },    // 66.67% rounded to 67
                { total: '7', matched: '3', expectedPercentage: 43 },    // 42.86% rounded to 43
                { total: '8', matched: '3', expectedPercentage: 38 },    // 37.5% rounded to 38
                { total: '9', matched: '4', expectedPercentage: 44 },    // 44.44% rounded to 44
            ];

            for (const testCase of testCases) {
                // Arrange
                jest.clearAllMocks();
                const mockAdvertisementResponse = {
                    advertisement: { id: 'ad-test', title: 'Percentage Test' },
                    matchSummary: {
                        total_items: testCase.total,
                        matched_items: testCase.matched,
                    },
                };

                (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
                (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

                // Act
                await finishLaterAdvertisement(mockCall, mockCallback);

                // Assert
                expect(updateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                    match_percentage: testCase.expectedPercentage,
                    advertisement_status: testCase.expectedPercentage === 100 ? 'COMPLETED' : 'NEEDS_REVIEW',
                });
            }
        });

        it('should handle string to number conversion for matchSummary fields', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: { id: 'ad-123', title: 'String Conversion Test' },
                matchSummary: {
                    total_items: '25',   // String numbers
                    matched_items: '20', // String numbers
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(updateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 80, // 20/25 * 100 = 80%
                advertisement_status: 'NEEDS_REVIEW',
            });
        });

        it('should handle invalid string values in matchSummary (converts to 0)', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: { id: 'ad-123', title: 'Invalid String Test' },
                matchSummary: {
                    total_items: 'invalid',
                    matched_items: 'also-invalid',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(updateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 0, // Number('invalid') || 0 = 0
                advertisement_status: 'NEEDS_REVIEW',
            });
        });

        it('should handle null values in matchSummary fields', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: { id: 'ad-123', title: 'Null Values Test' },
                matchSummary: {
                    total_items: null,
                    matched_items: null,
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(updateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 0, // Number(null) || 0 = 0
                advertisement_status: 'NEEDS_REVIEW',
            });
        });

        it('should handle large numbers correctly', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: { id: 'ad-123', title: 'Large Numbers Test' },
                matchSummary: {
                    total_items: '1000000',
                    matched_items: '999999',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(updateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 100, // 999999/1000000 * 100 = 99.9999% rounded to 100%
                advertisement_status: 'COMPLETED',
            });
        });
    });

    describe('Status determination logic', () => {
        it('should set status to COMPLETED only when match_percentage is exactly 100', async () => {
            // Test cases for status determination
            const testCases = [
                { percentage: 100, expectedStatus: 'COMPLETED' },
                { percentage: 99, expectedStatus: 'NEEDS_REVIEW' },
                { percentage: 1, expectedStatus: 'NEEDS_REVIEW' },
                { percentage: 0, expectedStatus: 'NEEDS_REVIEW' },
            ];

            for (const testCase of testCases) {
                // Arrange
                jest.clearAllMocks();
                const total = 100;
                const matched = testCase.percentage;

                const mockAdvertisementResponse = {
                    advertisement: { id: 'ad-status-test', title: 'Status Test' },
                    matchSummary: {
                        total_items: total.toString(),
                        matched_items: matched.toString(),
                    },
                };

                (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
                (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

                // Act
                await finishLaterAdvertisement(mockCall, mockCallback);

                // Assert
                expect(updateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                    match_percentage: testCase.percentage,
                    advertisement_status: testCase.expectedStatus,
                });
            }
        });

        it('should use correct Prisma enum values for status', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: { id: 'ad-123', title: 'Enum Test' },
                matchSummary: { total_items: '10', matched_items: '10' },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(updateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 100,
                advertisement_status: prismaClient.AdvertisementStatus.COMPLETED,
            });
        });
    });

    describe('Edge cases', () => {
        it('should handle field cleaning that removes advertisement_id', async () => {
            // Arrange
            const cleanedRequest = {
                // advertisement_id removed by removeEmptyFields
            };

            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const mockEmptyResponse = {
                advertisement: null,
                matchSummary: null,
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockEmptyResponse);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(getAdvertisementByID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle matchSummary with missing fields', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: { id: 'ad-123', title: 'Missing Fields Test' },
                matchSummary: {
                    // total_items and matched_items are missing
                    other_field: 'some value',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(updateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 0, // undefined fields default to 0
                advertisement_status: 'NEEDS_REVIEW',
            });
        });

        it('should handle decimal numbers in matchSummary', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: { id: 'ad-123', title: 'Decimal Test' },
                matchSummary: {
                    total_items: '10.5',
                    matched_items: '7.3',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(updateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 70, // 7.3/10.5 * 100 = 69.52% rounded to 70%
                advertisement_status: 'NEEDS_REVIEW',
            });
        });

        it('should handle very small numbers that round to 0', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: { id: 'ad-123', title: 'Small Numbers Test' },
                matchSummary: {
                    total_items: '1000000',
                    matched_items: '1',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(updateAdvertisementByID).toHaveBeenCalledWith('ad-123', {
                match_percentage: 0, // 1/1000000 * 100 = 0.0001% rounded to 0%
                advertisement_status: 'NEEDS_REVIEW',
            });
        });
    });

    describe('Service integration', () => {
        it('should verify correct service call sequence', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: { id: 'ad-sequence', title: 'Sequence Test' },
                matchSummary: { total_items: '10', matched_items: '5' },
            };

            let callOrder = 0;
            const getAdSpy = jest.fn().mockImplementation(async () => {
                getAdSpy.callOrder = ++callOrder;
                return mockAdvertisementResponse;
            });
            const updateAdSpy = jest.fn().mockImplementation(async () => {
                updateAdSpy.callOrder = ++callOrder;
                return true;
            });

            (getAdvertisementByID as jest.Mock).mockImplementation(getAdSpy);
            (updateAdvertisementByID as jest.Mock).mockImplementation(updateAdSpy);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert - Verify call order
            expect(getAdSpy.callOrder).toBeLessThan(updateAdSpy.callOrder);
        });

        it('should verify advertisement ID consistency across service calls', async () => {
            // Arrange
            const testAdId = 'consistent-ad-id-test';
            const consistentCall = {
                request: {
                    advertisement_id: testAdId,
                },
            };

            const mockAdvertisementResponse = {
                advertisement: { id: testAdId, title: 'Consistency Test' },
                matchSummary: { total_items: '5', matched_items: '3' },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(consistentCall, mockCallback);

            // Assert - Same ID should be used across all service calls
            expect(getAdvertisementByID).toHaveBeenCalledWith(testAdId);
            expect(updateAdvertisementByID).toHaveBeenCalledWith(
                testAdId,
                expect.any(Object)
            );
        });

        it('should validate update payload structure', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: { id: 'ad-payload', title: 'Payload Test' },
                matchSummary: { total_items: '8', matched_items: '6' },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (updateAdvertisementByID as jest.Mock).mockResolvedValue(true);

            // Act
            await finishLaterAdvertisement(mockCall, mockCallback);

            // Assert
            expect(updateAdvertisementByID).toHaveBeenCalledWith(
                'ad-123',
                expect.objectContaining({
                    match_percentage: expect.any(Number),
                    advertisement_status: expect.any(String),
                })
            );
        });
    });
});