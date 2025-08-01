
import { status } from '@grpc/grpc-js';

// Mock dependencies BEFORE importing the handler
jest.mock('@atc/common', () => ({
    errorMessage: {
        ADVERTISEMENT: {
            AD_IMAGE_NOT_FOUND: 'Ad Image Not Found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something Went Wrong',
        },
    },
    responseMessage: {
        ADVERTISEMENT: {
            ADVERTISEMENT_ITEM_ADDED: 'Advertisement Item Added successfully',
        },
    },
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
    matchProductsQueue: {
        add: jest.fn(),
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

jest.mock('../../../src/services/model.service', () => ({
    getAdImageByID: jest.fn(),
    createAdvertisementItem: jest.fn(),
}));

// Import after mocks
import { addAdvertisementItem } from '../../../src/handlers/addAdvertisementItem';
import { 
    getAdImageByID, 
    createAdvertisementItem 
} from '../../../src/services/model.service';
import { utilFns, matchProductsQueue } from '@atc/common';
import { logger } from '@atc/logger';

describe('addAdvertisementItem Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        
        mockCall = {
            request: {
                ad_image_id: 'ad-image-123',
                advertisement_text: 'Test advertisement text',
                retail_price: 100.50,
                promotional_price: 89.99,
            },
        };

        // Setup default mock implementations
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation((data) => data);
    });

    describe('Successful scenarios', () => {
        it('should successfully add advertisement item when ad image exists', async () => {
            // Arrange
            const mockAdImage = {
                id: 'ad-image-123',
                url: 'https://example.com/image.jpg',
                advertisement_id: 'ad-123',
            };

            const mockCreatedItem = {
                id: 'ad-item-456',
                advertisement_text: 'Test advertisement text',
                retail_price: 100.50,
                promotional_price: 89.99,
                ad_image_id: 'ad-image-123',
            };

            (getAdImageByID as jest.Mock).mockResolvedValue(mockAdImage);
            (createAdvertisementItem as jest.Mock).mockResolvedValue(mockCreatedItem);
            (matchProductsQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await addAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(getAdImageByID).toHaveBeenCalledWith('ad-image-123');
            expect(createAdvertisementItem).toHaveBeenCalledWith({
                AdvertisementImage: {
                    connect: {
                        id: 'ad-image-123',
                    },
                },
                advertisement_text: 'Test advertisement text',
                retail_price: 100.50,
                promotional_price: 89.99,
            });
            expect(matchProductsQueue.add).toHaveBeenCalledWith(
                'match:ad-item-456',
                { ad_item_id: 'ad-item-456' },
                {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 3000,
                    },
                }
            );
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Item Added successfully',
                status: status.OK,
            });
        });

        it('should handle request with minimal required fields', async () => {
            // Arrange
            const minimalCall = {
                request: {
                    ad_image_id: 'ad-image-123',
                    advertisement_text: 'Minimal text',
                },
            };

            const mockAdImage = { id: 'ad-image-123' };
            const mockCreatedItem = { id: 'ad-item-456' };

            (getAdImageByID as jest.Mock).mockResolvedValue(mockAdImage);
            (createAdvertisementItem as jest.Mock).mockResolvedValue(mockCreatedItem);
            (matchProductsQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await addAdvertisementItem(minimalCall, mockCallback);

            // Assert
            expect(createAdvertisementItem).toHaveBeenCalledWith({
                AdvertisementImage: {
                    connect: {
                        id: 'ad-image-123',
                    },
                },
                advertisement_text: 'Minimal text',
                retail_price: undefined,
                promotional_price: undefined,
            });
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Item Added successfully',
                status: status.OK,
            });
        });

        it('should call utilFns.removeEmptyFields to clean request data', async () => {
            // Arrange
            const requestWithEmptyFields = {
                ad_image_id: 'ad-image-123',
                advertisement_text: '',
                retail_price: 100.50,
                promotional_price: null,
            };

            const cleanedRequest = {
                ad_image_id: 'ad-image-123',
                retail_price: 100.50,
            };

            mockCall.request = requestWithEmptyFields;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);
            (getAdImageByID as jest.Mock).mockResolvedValue({ id: 'ad-image-123' });
            (createAdvertisementItem as jest.Mock).mockResolvedValue({ id: 'ad-item-456' });
            (matchProductsQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await addAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(createAdvertisementItem).toHaveBeenCalledWith({
                AdvertisementImage: {
                    connect: {
                        id: 'ad-image-123',
                    },
                },
                retail_price: 100.50,
                advertisement_text: undefined,
                promotional_price: undefined,
            });
        });
    });

    describe('Error scenarios', () => {
        it('should return NOT_FOUND when ad image does not exist', async () => {
            // Arrange
            (getAdImageByID as jest.Mock).mockResolvedValue(null);

            // Act
            await addAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(getAdImageByID).toHaveBeenCalledWith('ad-image-123');
            expect(createAdvertisementItem).not.toHaveBeenCalled();
            expect(matchProductsQueue.add).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Ad Image Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should return INTERNAL error when getAdImageByID throws an error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            (getAdImageByID as jest.Mock).mockRejectedValue(mockError);

            // Act
            await addAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(createAdvertisementItem).not.toHaveBeenCalled();
            expect(matchProductsQueue.add).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should return INTERNAL error when createAdvertisementItem throws an error', async () => {
            // Arrange
            const mockAdImage = { id: 'ad-image-123' };
            const mockError = new Error('Database creation failed');
            
            (getAdImageByID as jest.Mock).mockResolvedValue(mockAdImage);
            (createAdvertisementItem as jest.Mock).mockRejectedValue(mockError);

            // Act
            await addAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(matchProductsQueue.add).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should return INTERNAL error when matchProductsQueue.add throws an error', async () => {
            // Arrange
            const mockAdImage = { id: 'ad-image-123' };
            const mockCreatedItem = { id: 'ad-item-456' };
            const mockError = new Error('Queue operation failed');
            
            (getAdImageByID as jest.Mock).mockResolvedValue(mockAdImage);
            (createAdvertisementItem as jest.Mock).mockResolvedValue(mockCreatedItem);
            (matchProductsQueue.add as jest.Mock).mockRejectedValue(mockError);

            // Act
            await addAdvertisementItem(mockCall, mockCallback);

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
            await addAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(getAdImageByID).not.toHaveBeenCalled();
            expect(createAdvertisementItem).not.toHaveBeenCalled();
            expect(matchProductsQueue.add).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });
    });

    describe('Queue configuration', () => {
        it('should configure matchProductsQueue with correct retry settings', async () => {
            // Arrange
            const mockAdImage = { id: 'ad-image-123' };
            const mockCreatedItem = { id: 'ad-item-456' };
            
            (getAdImageByID as jest.Mock).mockResolvedValue(mockAdImage);
            (createAdvertisementItem as jest.Mock).mockResolvedValue(mockCreatedItem);
            (matchProductsQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await addAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(matchProductsQueue.add).toHaveBeenCalledWith(
                'match:ad-item-456',
                { ad_item_id: 'ad-item-456' },
                {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 3000,
                    },
                }
            );
        });

        it('should use the created advertisement item ID for queue job naming', async () => {
            // Arrange
            const mockAdImage = { id: 'ad-image-123' };
            const mockCreatedItem = { id: 'unique-ad-item-789' };
            
            (getAdImageByID as jest.Mock).mockResolvedValue(mockAdImage);
            (createAdvertisementItem as jest.Mock).mockResolvedValue(mockCreatedItem);
            (matchProductsQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await addAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(matchProductsQueue.add).toHaveBeenCalledWith(
                'match:unique-ad-item-789',
                { ad_item_id: 'unique-ad-item-789' },
                expect.any(Object)
            );
        });
    });

    describe('Edge cases', () => {
        it('should handle undefined promotional_price', async () => {
            // Arrange
            const callWithoutPromotionalPrice = {
                request: {
                    ad_image_id: 'ad-image-123',
                    advertisement_text: 'Test text',
                    retail_price: 100.50,
                    // promotional_price is undefined
                },
            };

            const mockAdImage = { id: 'ad-image-123' };
            const mockCreatedItem = { id: 'ad-item-456' };
            
            (getAdImageByID as jest.Mock).mockResolvedValue(mockAdImage);
            (createAdvertisementItem as jest.Mock).mockResolvedValue(mockCreatedItem);
            (matchProductsQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await addAdvertisementItem(callWithoutPromotionalPrice, mockCallback);

            // Assert
            expect(createAdvertisementItem).toHaveBeenCalledWith({
                AdvertisementImage: {
                    connect: {
                        id: 'ad-image-123',
                    },
                },
                advertisement_text: 'Test text',
                retail_price: 100.50,
                promotional_price: undefined,
            });
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Item Added successfully',
                status: status.OK,
            });
        });

        it('should handle zero values for prices', async () => {
            // Arrange
            const callWithZeroPrices = {
                request: {
                    ad_image_id: 'ad-image-123',
                    advertisement_text: 'Free item',
                    retail_price: 0,
                    promotional_price: 0,
                },
            };

            const mockAdImage = { id: 'ad-image-123' };
            const mockCreatedItem = { id: 'ad-item-456' };
            
            (getAdImageByID as jest.Mock).mockResolvedValue(mockAdImage);
            (createAdvertisementItem as jest.Mock).mockResolvedValue(mockCreatedItem);
            (matchProductsQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await addAdvertisementItem(callWithZeroPrices, mockCallback);

            // Assert
            expect(createAdvertisementItem).toHaveBeenCalledWith({
                AdvertisementImage: {
                    connect: {
                        id: 'ad-image-123',
                    },
                },
                advertisement_text: 'Free item',
                retail_price: 0,
                promotional_price: 0,
            });
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement Item Added successfully',
                status: status.OK,
            });
        });

        it('should handle empty string ad_image_id after removeEmptyFields', async () => {
            // Arrange
            const mockCallWithEmptyId = {
                request: {
                    ad_image_id: '',
                    advertisement_text: 'Test text',
                },
            };

            const cleanedRequest = {
                advertisement_text: 'Test text',
                // ad_image_id removed by removeEmptyFields
            };

            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);
            (getAdImageByID as jest.Mock).mockResolvedValue(null);

            // Act
            await addAdvertisementItem(mockCallWithEmptyId, mockCallback);

            // Assert
            expect(getAdImageByID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Ad Image Not Found',
                status: status.NOT_FOUND,
            });
        });
    });

    describe('Integration with services', () => {
        it('should pass correct data structure to createAdvertisementItem', async () => {
            // Arrange
            const mockAdImage = { id: 'ad-image-123' };
            const mockCreatedItem = { id: 'ad-item-456' };
            
            (getAdImageByID as jest.Mock).mockResolvedValue(mockAdImage);
            (createAdvertisementItem as jest.Mock).mockResolvedValue(mockCreatedItem);
            (matchProductsQueue.add as jest.Mock).mockResolvedValue(true);

            // Act
            await addAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(createAdvertisementItem).toHaveBeenCalledTimes(1);
            expect(createAdvertisementItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    AdvertisementImage: {
                        connect: {
                            id: expect.any(String),
                        },
                    },
                    advertisement_text: expect.any(String),
                    retail_price: expect.any(Number),
                    promotional_price: expect.any(Number),
                })
            );
        });

        it('should verify service call order', async () => {
            // Arrange
            const mockAdImage = { id: 'ad-image-123' };
            const mockCreatedItem = { id: 'ad-item-456' };
            
            const getAdImageSpy = jest.fn().mockResolvedValue(mockAdImage);
            const createItemSpy = jest.fn().mockResolvedValue(mockCreatedItem);
            const queueSpy = jest.fn().mockResolvedValue(true);

            (getAdImageByID as jest.Mock).mockImplementation(getAdImageSpy);
            (createAdvertisementItem as jest.Mock).mockImplementation(createItemSpy);
            (matchProductsQueue.add as jest.Mock).mockImplementation(queueSpy);

            // Act
            await addAdvertisementItem(mockCall, mockCallback);

            // Assert - Verify call order using mock call timestamps
            const getAdImageCallTime = getAdImageSpy.mock.invocationCallOrder[0];
            const createItemCallTime = createItemSpy.mock.invocationCallOrder[0];
            const queueCallTime = queueSpy.mock.invocationCallOrder[0];

            expect(getAdImageCallTime).toBeLessThan(createItemCallTime);
            expect(createItemCallTime).toBeLessThan(queueCallTime);
        });
    });
});