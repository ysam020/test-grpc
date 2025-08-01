import { status } from '@grpc/grpc-js';

// Mock business logic dependencies BEFORE importing the handler
jest.mock('@atc/common', () => ({
    errorMessage: {
        RETAILER: {
            NOT_FOUND: 'Retailer Not Found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something Went Wrong',
        },
    },
    responseMessage: {
        ADVERTISEMENT: {
            CREATED: 'Advertisement Created successfully',
        },
    },
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
    processFilesQueue: {
        add: jest.fn(),
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

jest.mock('../../../src/services/model.service', () => ({
    getRetailerByID: jest.fn(),
    addAdvertisement: jest.fn(),
}));

// Import after mocks
import { createAdvertisement } from '../../../src/handlers/createAdvertisement';
import {
    getRetailerByID,
    addAdvertisement,
} from '../../../src/services/model.service';
import { utilFns, processFilesQueue } from '@atc/common';
import { logger } from '@atc/logger';

describe('createAdvertisement Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        
        mockCall = {
            request: {
                title: 'Test Advertisement',
                keyword: 'test-keyword',
                retailer_id: 'retailer-123',
                advertisement_type: 'BANNER',
                start_date: '2024-01-01',
                end_date: '2024-12-31',
                files: [
                    {
                        buffer: Buffer.from('test-image-data'),
                        mime_type: 'image/jpeg',
                        content_length: 1024,
                    },
                    {
                        buffer: Buffer.from('test-video-data'),
                        mime_type: 'video/mp4',
                        content_length: 2048,
                    },
                ],
            },
        };

        // Setup default mock implementations
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation((data) => data);
    });

    describe('Successful scenarios', () => {
        it('should successfully create advertisement when all conditions are met', async () => {
            // Arrange
            const mockRetailer = {
                id: 'retailer-123',
                retailer_name: 'Test Retailer',
                contact_email: 'test@retailer.com',
            };

            const mockAdvertisement = {
                id: 'ad-456',
                title: 'Test Advertisement',
                keyword: 'test-keyword',
                retailer_id: 'retailer-123',
                advertisement_type: 'BANNER',
                start_date: '2024-01-01',
                end_date: '2024-12-31',
            };

            (getRetailerByID as jest.Mock).mockResolvedValue(mockRetailer);
            (addAdvertisement as jest.Mock).mockResolvedValue(mockAdvertisement);
            (processFilesQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await createAdvertisement(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(getRetailerByID).toHaveBeenCalledWith('retailer-123');
            expect(addAdvertisement).toHaveBeenCalledWith({
                title: 'Test Advertisement',
                keyword: 'test-keyword',
                Retailer: { connect: { id: 'retailer-123' } },
                advertisement_type: 'BANNER',
                start_date: '2024-01-01',
                end_date: '2024-12-31',
            });
            expect(processFilesQueue.add).toHaveBeenCalledWith(
                'process:ad-456',
                {
                    advertisement_id: 'ad-456',
                    files: [
                        {
                            buffer: Buffer.from('test-image-data'),
                            mime_type: 'image/jpeg',
                            content_length: 1024,
                        },
                        {
                            buffer: Buffer.from('test-video-data'),
                            mime_type: 'video/mp4',
                            content_length: 2048,
                        },
                    ],
                },
                {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                }
            );
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Created successfully',
                status: status.OK,
            });
        });

        it('should handle advertisement with minimal required fields', async () => {
            // Arrange
            const minimalCall = {
                request: {
                    title: 'Minimal Ad',
                    retailer_id: 'retailer-123',
                    advertisement_type: 'BANNER',
                    files: [
                        {
                            buffer: Buffer.from('minimal-data'),
                            mime_type: 'image/png',
                            content_length: 512,
                        },
                    ],
                },
            };

            const mockRetailer = { id: 'retailer-123', retailer_name: 'Test Retailer' };
            const mockAdvertisement = { id: 'ad-789', title: 'Minimal Ad' };

            (getRetailerByID as jest.Mock).mockResolvedValue(mockRetailer);
            (addAdvertisement as jest.Mock).mockResolvedValue(mockAdvertisement);
            (processFilesQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await createAdvertisement(minimalCall, mockCallback);

            // Assert
            expect(addAdvertisement).toHaveBeenCalledWith({
                title: 'Minimal Ad',
                keyword: undefined,
                Retailer: { connect: { id: 'retailer-123' } },
                advertisement_type: 'BANNER',
                start_date: undefined,
                end_date: undefined,
            });
            expect(processFilesQueue.add).toHaveBeenCalledWith(
                'process:ad-789',
                {
                    advertisement_id: 'ad-789',
                    files: [
                        {
                            buffer: Buffer.from('minimal-data'),
                            mime_type: 'image/png',
                            content_length: 512,
                        },
                    ],
                },
                expect.any(Object)
            );
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Created successfully',
                status: status.OK,
            });
        });

        it('should handle advertisement with single file', async () => {
            // Arrange
            const singleFileCall = {
                request: {
                    title: 'Single File Ad',
                    retailer_id: 'retailer-123',
                    advertisement_type: 'BANNER',
                    files: [
                        {
                            buffer: Buffer.from('single-file-data'),
                            mime_type: 'image/gif',
                            content_length: 256,
                        },
                    ],
                },
            };

            const mockRetailer = { id: 'retailer-123' };
            const mockAdvertisement = { id: 'ad-single' };

            (getRetailerByID as jest.Mock).mockResolvedValue(mockRetailer);
            (addAdvertisement as jest.Mock).mockResolvedValue(mockAdvertisement);
            (processFilesQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await createAdvertisement(singleFileCall, mockCallback);

            // Assert
            expect(processFilesQueue.add).toHaveBeenCalledWith(
                'process:ad-single',
                {
                    advertisement_id: 'ad-single',
                    files: [
                        {
                            buffer: Buffer.from('single-file-data'),
                            mime_type: 'image/gif',
                            content_length: 256,
                        },
                    ],
                },
                expect.any(Object)
            );
        });

        it('should call utilFns.removeEmptyFields to clean request data', async () => {
            // Arrange
            const requestWithEmptyFields = {
                title: 'Test Ad',
                keyword: '',
                retailer_id: 'retailer-123',
                advertisement_type: 'BANNER',
                start_date: null,
                end_date: undefined,
                files: [
                    {
                        buffer: Buffer.from('test-data'),
                        mime_type: 'image/jpeg',
                        content_length: 1024,
                    },
                ],
            };

            const cleanedRequest = {
                title: 'Test Ad',
                retailer_id: 'retailer-123',
                advertisement_type: 'BANNER',
                files: [
                    {
                        buffer: Buffer.from('test-data'),
                        mime_type: 'image/jpeg',
                        content_length: 1024,
                    },
                ],
            };

            mockCall.request = requestWithEmptyFields;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);
            
            const mockRetailer = { id: 'retailer-123' };
            const mockAdvertisement = { id: 'ad-clean' };

            (getRetailerByID as jest.Mock).mockResolvedValue(mockRetailer);
            (addAdvertisement as jest.Mock).mockResolvedValue(mockAdvertisement);
            (processFilesQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await createAdvertisement(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(addAdvertisement).toHaveBeenCalledWith({
                title: 'Test Ad',
                keyword: undefined,
                Retailer: { connect: { id: 'retailer-123' } },
                advertisement_type: 'BANNER',
                start_date: undefined,
                end_date: undefined,
            });
        });
    });

    describe('Error scenarios', () => {
        it('should return NOT_FOUND when retailer does not exist', async () => {
            // Arrange
            (getRetailerByID as jest.Mock).mockResolvedValue(null);

            // Act
            await createAdvertisement(mockCall, mockCallback);

            // Assert
            expect(getRetailerByID).toHaveBeenCalledWith('retailer-123');
            expect(addAdvertisement).not.toHaveBeenCalled();
            expect(processFilesQueue.add).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Retailer Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should return INTERNAL error when getRetailerByID throws an error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            (getRetailerByID as jest.Mock).mockRejectedValue(mockError);

            // Act
            await createAdvertisement(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(addAdvertisement).not.toHaveBeenCalled();
            expect(processFilesQueue.add).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should return INTERNAL error when addAdvertisement throws an error', async () => {
            // Arrange
            const mockRetailer = { id: 'retailer-123' };
            const mockError = new Error('Advertisement creation failed');

            (getRetailerByID as jest.Mock).mockResolvedValue(mockRetailer);
            (addAdvertisement as jest.Mock).mockRejectedValue(mockError);

            // Act
            await createAdvertisement(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(processFilesQueue.add).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should return INTERNAL error when processFilesQueue.add throws an error', async () => {
            // Arrange
            const mockRetailer = { id: 'retailer-123' };
            const mockAdvertisement = { id: 'ad-456' };
            const mockError = new Error('Queue operation failed');

            (getRetailerByID as jest.Mock).mockResolvedValue(mockRetailer);
            (addAdvertisement as jest.Mock).mockResolvedValue(mockAdvertisement);
            (processFilesQueue.add as jest.Mock).mockRejectedValue(mockError);

            // Act
            await createAdvertisement(mockCall, mockCallback);

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
            await createAdvertisement(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(getRetailerByID).not.toHaveBeenCalled();
            expect(addAdvertisement).not.toHaveBeenCalled();
            expect(processFilesQueue.add).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });
    });

    describe('File processing queue configuration', () => {
        it('should configure processFilesQueue with correct retry settings', async () => {
            // Arrange
            const mockRetailer = { id: 'retailer-123' };
            const mockAdvertisement = { id: 'ad-456' };

            (getRetailerByID as jest.Mock).mockResolvedValue(mockRetailer);
            (addAdvertisement as jest.Mock).mockResolvedValue(mockAdvertisement);
            (processFilesQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await createAdvertisement(mockCall, mockCallback);

            // Assert
            expect(processFilesQueue.add).toHaveBeenCalledWith(
                'process:ad-456',
                expect.any(Object),
                {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                }
            );
        });

        it('should use the created advertisement ID for queue job naming', async () => {
            // Arrange
            const mockRetailer = { id: 'retailer-123' };
            const mockAdvertisement = { id: 'unique-ad-789' };

            (getRetailerByID as jest.Mock).mockResolvedValue(mockRetailer);
            (addAdvertisement as jest.Mock).mockResolvedValue(mockAdvertisement);
            (processFilesQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await createAdvertisement(mockCall, mockCallback);

            // Assert
            expect(processFilesQueue.add).toHaveBeenCalledWith(
                'process:unique-ad-789',
                expect.objectContaining({
                    advertisement_id: 'unique-ad-789',
                }),
                expect.any(Object)
            );
        });

        it('should correctly map file data for queue processing', async () => {
            // Arrange
            const customFileCall = {
                request: {
                    title: 'File Test Ad',
                    retailer_id: 'retailer-123',
                    advertisement_type: 'BANNER',
                    files: [
                        {
                            buffer: Buffer.from('custom-image-data'),
                            mime_type: 'image/webp',
                            content_length: 4096,
                        },
                        {
                            buffer: Buffer.from('custom-video-data'),
                            mime_type: 'video/webm',
                            content_length: 8192,
                        },
                    ],
                },
            };

            const mockRetailer = { id: 'retailer-123' };
            const mockAdvertisement = { id: 'ad-files' };

            (getRetailerByID as jest.Mock).mockResolvedValue(mockRetailer);
            (addAdvertisement as jest.Mock).mockResolvedValue(mockAdvertisement);
            (processFilesQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await createAdvertisement(customFileCall, mockCallback);

            // Assert
            expect(processFilesQueue.add).toHaveBeenCalledWith(
                'process:ad-files',
                {
                    advertisement_id: 'ad-files',
                    files: [
                        {
                            buffer: Buffer.from('custom-image-data'),
                            mime_type: 'image/webp',
                            content_length: 4096,
                        },
                        {
                            buffer: Buffer.from('custom-video-data'),
                            mime_type: 'video/webm',
                            content_length: 8192,
                        },
                    ],
                },
                expect.any(Object)
            );
        });
    });

    describe('Edge cases', () => {
        it('should handle empty files array', async () => {
            // Arrange
            const emptyFilesCall = {
                request: {
                    title: 'No Files Ad',
                    retailer_id: 'retailer-123',
                    advertisement_type: 'BANNER',
                    files: [],
                },
            };

            const mockRetailer = { id: 'retailer-123' };
            const mockAdvertisement = { id: 'ad-empty-files' };

            (getRetailerByID as jest.Mock).mockResolvedValue(mockRetailer);
            (addAdvertisement as jest.Mock).mockResolvedValue(mockAdvertisement);
            (processFilesQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await createAdvertisement(emptyFilesCall, mockCallback);

            // Assert
            expect(processFilesQueue.add).toHaveBeenCalledWith(
                'process:ad-empty-files',
                {
                    advertisement_id: 'ad-empty-files',
                    files: [],
                },
                expect.any(Object)
            );
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Created successfully',
                status: status.OK,
            });
        });

        it('should handle large file with zero content length', async () => {
            // Arrange
            const zeroLengthCall = {
                request: {
                    title: 'Zero Length File Ad',
                    retailer_id: 'retailer-123',
                    advertisement_type: 'BANNER',
                    files: [
                        {
                            buffer: Buffer.alloc(0), // Empty buffer
                            mime_type: 'image/jpeg',
                            content_length: 0,
                        },
                    ],
                },
            };

            const mockRetailer = { id: 'retailer-123' };
            const mockAdvertisement = { id: 'ad-zero-length' };

            (getRetailerByID as jest.Mock).mockResolvedValue(mockRetailer);
            (addAdvertisement as jest.Mock).mockResolvedValue(mockAdvertisement);
            (processFilesQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await createAdvertisement(zeroLengthCall, mockCallback);

            // Assert
            expect(processFilesQueue.add).toHaveBeenCalledWith(
                'process:ad-zero-length',
                {
                    advertisement_id: 'ad-zero-length',
                    files: [
                        {
                            buffer: Buffer.alloc(0),
                            mime_type: 'image/jpeg',
                            content_length: 0,
                        },
                    ],
                },
                expect.any(Object)
            );
        });

        it('should handle field cleaning that removes required fields', async () => {
            // Arrange
            const cleanedRequest = {
                title: 'Cleaned Ad',
                // retailer_id removed by removeEmptyFields
                advertisement_type: 'BANNER',
                files: [],
            };

            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);
            (getRetailerByID as jest.Mock).mockResolvedValue(null);

            // Act
            await createAdvertisement(mockCall, mockCallback);

            // Assert
            expect(getRetailerByID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Retailer Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle different advertisement types', async () => {
            // Arrange
            const videoAdCall = {
                request: {
                    title: 'Video Advertisement',
                    retailer_id: 'retailer-123',
                    advertisement_type: 'VIDEO',
                    files: [
                        {
                            buffer: Buffer.from('video-content'),
                            mime_type: 'video/mp4',
                            content_length: 1048576, // 1MB
                        },
                    ],
                },
            };

            const mockRetailer = { id: 'retailer-123' };
            const mockAdvertisement = { id: 'ad-video' };

            (getRetailerByID as jest.Mock).mockResolvedValue(mockRetailer);
            (addAdvertisement as jest.Mock).mockResolvedValue(mockAdvertisement);
            (processFilesQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await createAdvertisement(videoAdCall, mockCallback);

            // Assert
            expect(addAdvertisement).toHaveBeenCalledWith(
                expect.objectContaining({
                    advertisement_type: 'VIDEO',
                })
            );
        });
    });

    describe('Service integration', () => {
        it('should pass correct data structure to addAdvertisement', async () => {
            // Arrange
            const mockRetailer = { id: 'retailer-123' };
            const mockAdvertisement = { id: 'ad-456' };

            (getRetailerByID as jest.Mock).mockResolvedValue(mockRetailer);
            (addAdvertisement as jest.Mock).mockResolvedValue(mockAdvertisement);
            (processFilesQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await createAdvertisement(mockCall, mockCallback);

            // Assert
            expect(addAdvertisement).toHaveBeenCalledTimes(1);
            expect(addAdvertisement).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: expect.any(String),
                    keyword: expect.any(String),
                    Retailer: {
                        connect: {
                            id: expect.any(String),
                        },
                    },
                    advertisement_type: expect.any(String),
                    start_date: expect.any(String),
                    end_date: expect.any(String),
                })
            );
        });

        it('should verify service call sequence', async () => {
            // Arrange
            const mockRetailer = { id: 'retailer-123' };
            const mockAdvertisement = { id: 'ad-456' };

            // Create spies that track call order
            let callOrder = 0;
            const getRetailerSpy = jest.fn().mockImplementation(async () => {
                getRetailerSpy.callOrder = ++callOrder;
                return mockRetailer;
            });
            const addAdSpy = jest.fn().mockImplementation(async () => {
                addAdSpy.callOrder = ++callOrder;
                return mockAdvertisement;
            });
            const queueSpy = jest.fn().mockImplementation(async () => {
                queueSpy.callOrder = ++callOrder;
                return true;
            });

            (getRetailerByID as jest.Mock).mockImplementation(getRetailerSpy);
            (addAdvertisement as jest.Mock).mockImplementation(addAdSpy);
            (processFilesQueue.add as jest.Mock).mockImplementation(queueSpy);

            // Act
            await createAdvertisement(mockCall, mockCallback);

            // Assert - Verify call order using custom tracking
            expect(getRetailerSpy.callOrder).toBeLessThan(addAdSpy.callOrder);
            expect(addAdSpy.callOrder).toBeLessThan(queueSpy.callOrder);
        });

        it('should handle different retailer data structures', async () => {
            // Arrange
            const complexRetailer = {
                id: 'retailer-123',
                retailer_name: 'Complex Retailer',
                contact_email: 'contact@complex.com',
                contact_phone: '+1234567890',
                address: '123 Retailer St',
                is_active: true,
            };

            const mockAdvertisement = { id: 'ad-complex' };

            (getRetailerByID as jest.Mock).mockResolvedValue(complexRetailer);
            (addAdvertisement as jest.Mock).mockResolvedValue(mockAdvertisement);
            (processFilesQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await createAdvertisement(mockCall, mockCallback);

            // Assert
            expect(addAdvertisement).toHaveBeenCalledWith(
                expect.objectContaining({
                    Retailer: { connect: { id: 'retailer-123' } },
                })
            );
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Created successfully',
                status: status.OK,
            });
        });
    });
});