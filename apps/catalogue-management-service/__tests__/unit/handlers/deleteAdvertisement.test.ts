import { status } from '@grpc/grpc-js';

// Mock business logic dependencies BEFORE importing the handler
jest.mock('@atc/common', () => ({
    constants: {
        ADVERTISEMENT_IMAGE_FOLDER: 'advertisements',
    },
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
            DELETED: 'Advertisement Deleted successfully',
        },
    },
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
    deleteS3Folder: jest.fn(),
    deleteS3Object: jest.fn(),
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

jest.mock('../../../src/services/model.service', () => ({
    getAdvertisementByID: jest.fn(),
    deleteAdvertisementByID: jest.fn(),
}));

// Import after mocks
import { deleteAdvertisement } from '../../../src/handlers/deleteAdvertisement';
import {
    getAdvertisementByID,
    deleteAdvertisementByID,
} from '../../../src/services/model.service';
import { utilFns, deleteS3Folder, constants } from '@atc/common';
import { logger } from '@atc/logger';

describe('deleteAdvertisement Handler', () => {
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
        it('should successfully delete advertisement when it exists', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'ad-123',
                    title: 'Test Advertisement',
                    keyword: 'test-keyword',
                    retailer_id: 'retailer-456',
                    advertisement_type: 'BANNER',
                    start_date: '2024-01-01',
                    end_date: '2024-12-31',
                    created_at: new Date(),
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (deleteAdvertisementByID as jest.Mock).mockResolvedValue(true);
            (deleteS3Folder as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(getAdvertisementByID).toHaveBeenCalledWith('ad-123');
            expect(deleteAdvertisementByID).toHaveBeenCalledWith('ad-123');
            expect(deleteS3Folder).toHaveBeenCalledWith('advertisements/ad-123');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Deleted successfully',
                status: status.OK,
            });
        });

        it('should handle advertisement with different ID format', async () => {
            // Arrange
            const uuidCall = {
                request: {
                    advertisement_id: 'ad-uuid-550e8400-e29b-41d4-a716-446655440000',
                },
            };

            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'ad-uuid-550e8400-e29b-41d4-a716-446655440000',
                    title: 'UUID Advertisement',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (deleteAdvertisementByID as jest.Mock).mockResolvedValue(true);
            (deleteS3Folder as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteAdvertisement(uuidCall, mockCallback);

            // Assert
            expect(getAdvertisementByID).toHaveBeenCalledWith('ad-uuid-550e8400-e29b-41d4-a716-446655440000');
            expect(deleteAdvertisementByID).toHaveBeenCalledWith('ad-uuid-550e8400-e29b-41d4-a716-446655440000');
            expect(deleteS3Folder).toHaveBeenCalledWith('advertisements/ad-uuid-550e8400-e29b-41d4-a716-446655440000');
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
                advertisement: {
                    id: 'ad-123',
                    title: 'Clean Advertisement',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (deleteAdvertisementByID as jest.Mock).mockResolvedValue(true);
            (deleteS3Folder as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(getAdvertisementByID).toHaveBeenCalledWith('ad-123');
        });

        it('should handle advertisement with minimal data structure', async () => {
            // Arrange
            const mockMinimalAdvertisementResponse = {
                advertisement: {
                    id: 'ad-minimal',
                    // Only ID present, other fields might be optional
                },
            };

            const minimalCall = {
                request: {
                    advertisement_id: 'ad-minimal',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockMinimalAdvertisementResponse);
            (deleteAdvertisementByID as jest.Mock).mockResolvedValue(true);
            (deleteS3Folder as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteAdvertisement(minimalCall, mockCallback);

            // Assert
            expect(deleteS3Folder).toHaveBeenCalledWith('advertisements/ad-minimal');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Deleted successfully',
                status: status.OK,
            });
        });
    });

    describe('Error scenarios', () => {
        it('should return NOT_FOUND when advertisement does not exist', async () => {
            // Arrange
            const mockEmptyResponse = {
                advertisement: null,
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockEmptyResponse);

            // Act
            await deleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(getAdvertisementByID).toHaveBeenCalledWith('ad-123');
            expect(deleteAdvertisementByID).not.toHaveBeenCalled();
            expect(deleteS3Folder).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should return NOT_FOUND when advertisement is undefined', async () => {
            // Arrange
            const mockUndefinedResponse = {
                advertisement: undefined,
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockUndefinedResponse);

            // Act
            await deleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(getAdvertisementByID).toHaveBeenCalledWith('ad-123');
            expect(deleteAdvertisementByID).not.toHaveBeenCalled();
            expect(deleteS3Folder).not.toHaveBeenCalled();
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
            await deleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(deleteAdvertisementByID).not.toHaveBeenCalled();
            expect(deleteS3Folder).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should return INTERNAL error when deleteAdvertisementByID throws an error', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'ad-123',
                    title: 'Test Advertisement',
                },
            };
            const mockError = new Error('Delete operation failed');

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (deleteAdvertisementByID as jest.Mock).mockRejectedValue(mockError);

            // Act
            await deleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(deleteS3Folder).not.toHaveBeenCalled(); // Should not reach S3 deletion
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should return INTERNAL error when deleteS3Folder throws an error', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'ad-123',
                    title: 'Test Advertisement',
                },
            };
            const mockError = new Error('S3 deletion failed');

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (deleteAdvertisementByID as jest.Mock).mockResolvedValue(true);
            (deleteS3Folder as jest.Mock).mockRejectedValue(mockError);

            // Act
            await deleteAdvertisement(mockCall, mockCallback);

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
            await deleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(getAdvertisementByID).not.toHaveBeenCalled();
            expect(deleteAdvertisementByID).not.toHaveBeenCalled();
            expect(deleteS3Folder).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });
    });

    describe('S3 folder deletion', () => {
        it('should construct correct S3 folder path using constants', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'ad-123', // Use the same ID as in the request
                    title: 'S3 Test Advertisement',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (deleteAdvertisementByID as jest.Mock).mockResolvedValue(true);
            (deleteS3Folder as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(deleteS3Folder).toHaveBeenCalledWith('advertisements/ad-123');
            expect(deleteS3Folder).toHaveBeenCalledWith(`${constants.ADVERTISEMENT_IMAGE_FOLDER}/ad-123`);
        });

        it('should use advertisement.id from response for S3 path construction', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'different-internal-id',
                    title: 'Different ID Test',
                },
            };

            // Note: request has 'ad-123' but advertisement response has different ID
            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (deleteAdvertisementByID as jest.Mock).mockResolvedValue(true);
            (deleteS3Folder as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(deleteS3Folder).toHaveBeenCalledWith('advertisements/different-internal-id');
        });

        it('should handle S3 folder deletion with special characters in advertisement ID', async () => {
            // Arrange
            const specialIdCall = {
                request: {
                    advertisement_id: 'ad-special-123_456-789',
                },
            };

            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'ad-special-123_456-789',
                    title: 'Special Characters Advertisement',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (deleteAdvertisementByID as jest.Mock).mockResolvedValue(true);
            (deleteS3Folder as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteAdvertisement(specialIdCall, mockCallback);

            // Assert
            expect(deleteS3Folder).toHaveBeenCalledWith('advertisements/ad-special-123_456-789');
        });

        it('should handle different ADVERTISEMENT_IMAGE_FOLDER constant values', async () => {
            // Arrange
            // Mock a different constant value
            (constants.ADVERTISEMENT_IMAGE_FOLDER as any) = 'custom-ads-folder';

            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'ad-custom-folder',
                    title: 'Custom Folder Advertisement',
                },
            };

            const customFolderCall = {
                request: {
                    advertisement_id: 'ad-custom-folder',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (deleteAdvertisementByID as jest.Mock).mockResolvedValue(true);
            (deleteS3Folder as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteAdvertisement(customFolderCall, mockCallback);

            // Assert
            expect(deleteS3Folder).toHaveBeenCalledWith('custom-ads-folder/ad-custom-folder');

            // Restore original constant for other tests
            (constants.ADVERTISEMENT_IMAGE_FOLDER as any) = 'advertisements';
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
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockEmptyResponse);

            // Act
            await deleteAdvertisement(mockCall, mockCallback);

            // Assert
            expect(getAdvertisementByID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle empty string advertisement_id', async () => {
            // Arrange
            const emptyIdCall = {
                request: {
                    advertisement_id: '',
                },
            };

            const cleanedRequest = {
                // Empty string might be removed by removeEmptyFields
            };

            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);
            
            const mockEmptyResponse = {
                advertisement: null,
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockEmptyResponse);

            // Act
            await deleteAdvertisement(emptyIdCall, mockCallback);

            // Assert
            expect(getAdvertisementByID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle malformed response structure from getAdvertisementByID', async () => {
            // Arrange
            const malformedResponse = {
                // Missing 'advertisement' key
                data: {
                    id: 'ad-123',
                    title: 'Malformed',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(malformedResponse);

            // Act
            await deleteAdvertisement(mockCall, mockCallback);

            // Assert - Should treat as advertisement not found since advertisement key is missing
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle null response from getAdvertisementByID', async () => {
            // Arrange
            (getAdvertisementByID as jest.Mock).mockResolvedValue(null);

            // Act & Assert - This should throw an error due to null.advertisement access
            await deleteAdvertisement(mockCall, mockCallback);

            expect(logger.error).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });
    });

    describe('Service integration', () => {
        it('should verify correct service call sequence', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'ad-sequence',
                    title: 'Sequence Test',
                },
            };

            let callOrder = 0;
            const getAdSpy = jest.fn().mockImplementation(async () => {
                getAdSpy.callOrder = ++callOrder;
                return mockAdvertisementResponse;
            });
            const deleteAdSpy = jest.fn().mockImplementation(async () => {
                deleteAdSpy.callOrder = ++callOrder;
                return true;
            });
            const deleteS3Spy = jest.fn().mockImplementation(async () => {
                deleteS3Spy.callOrder = ++callOrder;
                return true;
            });

            (getAdvertisementByID as jest.Mock).mockImplementation(getAdSpy);
            (deleteAdvertisementByID as jest.Mock).mockImplementation(deleteAdSpy);
            (deleteS3Folder as jest.Mock).mockImplementation(deleteS3Spy);

            // Act
            await deleteAdvertisement(mockCall, mockCallback);

            // Assert - Verify all services were called in sequence
            expect(getAdSpy.callOrder).toBeLessThan(deleteAdSpy.callOrder);
            expect(deleteAdSpy.callOrder).toBeLessThan(deleteS3Spy.callOrder);
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
                advertisement: {
                    id: testAdId,
                    title: 'Consistency Test',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (deleteAdvertisementByID as jest.Mock).mockResolvedValue(true);
            (deleteS3Folder as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteAdvertisement(consistentCall, mockCallback);

            // Assert - Same ID should be used across all service calls
            expect(getAdvertisementByID).toHaveBeenCalledWith(testAdId);
            expect(deleteAdvertisementByID).toHaveBeenCalledWith(testAdId);
            expect(deleteS3Folder).toHaveBeenCalledWith(`advertisements/${testAdId}`);
        });

        it('should handle partial service failures gracefully', async () => {
            // Arrange - Database delete succeeds but S3 delete fails
            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'ad-partial-fail',
                    title: 'Partial Failure Test',
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (deleteAdvertisementByID as jest.Mock).mockResolvedValue(true);
            (deleteS3Folder as jest.Mock).mockRejectedValue(new Error('S3 service unavailable'));

            // Act
            await deleteAdvertisement(mockCall, mockCallback);

            // Assert - Should still log error and return INTERNAL status
            expect(deleteAdvertisementByID).toHaveBeenCalled(); // DB operation completed
            expect(deleteS3Folder).toHaveBeenCalled(); // S3 operation attempted
            expect(logger.error).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should validate response structure requirements', async () => {
            // Arrange
            const mockAdvertisementResponse = {
                advertisement: {
                    id: 'ad-validation',
                    title: 'Validation Test',
                    // Include extra fields to ensure handler only uses what it needs
                    extra_field: 'should be ignored',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            };

            (getAdvertisementByID as jest.Mock).mockResolvedValue(mockAdvertisementResponse);
            (deleteAdvertisementByID as jest.Mock).mockResolvedValue(true);
            (deleteS3Folder as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteAdvertisement(mockCall, mockCallback);

            // Assert - Handler should work regardless of extra fields in response
            expect(deleteS3Folder).toHaveBeenCalledWith('advertisements/ad-validation');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Deleted successfully',
                status: status.OK,
            });
        });
    });
});