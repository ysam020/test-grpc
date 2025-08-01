jest.mock('../../../src/client', () => ({
    productStub: {
        getProductByIDs: jest.fn(),
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));

import { getProductByIDs } from '../../../src/services/client.service';
import { productStub } from '../../../src/client';
import { logger } from '@atc/logger';

describe('Client Service', () => {
    let mockProductStub: jest.Mocked<typeof productStub>;
    let mockLogger: jest.Mocked<typeof logger>;

    beforeEach(() => {
        mockProductStub = productStub as jest.Mocked<typeof productStub>;
        mockLogger = logger as jest.Mocked<typeof logger>;
        jest.clearAllMocks();
    });

    describe('getProductByIDs', () => {
        const mockProductIDs = ['prod1', 'prod2', 'prod3'];
        const mockMetadata = { authorization: 'Bearer token' };

        it('should successfully get products by IDs', async () => {
            // Arrange
            const mockResponse = {
                product_ids: ['prod1', 'prod2', 'prod3'],
                status: 'SUCCESS',
            };

            mockProductStub.getProductByIDs.mockImplementation((params, metadata, callback) => {
                callback(null, mockResponse);
            });

            // Act
            const result = await getProductByIDs(mockProductIDs, mockMetadata);

            // Assert
            expect(mockProductStub.getProductByIDs).toHaveBeenCalledWith(
                { product_ids: mockProductIDs },
                mockMetadata,
                expect.any(Function)
            );
            expect(result).toEqual(mockResponse.product_ids);
            expect(mockLogger.error).not.toHaveBeenCalled();
        });

        it('should handle empty product IDs array', async () => {
            // Arrange
            const emptyProductIDs: string[] = [];
            const mockResponse = {
                product_ids: [],
                status: 'SUCCESS',
            };

            mockProductStub.getProductByIDs.mockImplementation((params, metadata, callback) => {
                callback(null, mockResponse);
            });

            // Act
            const result = await getProductByIDs(emptyProductIDs, mockMetadata);

            // Assert
            expect(mockProductStub.getProductByIDs).toHaveBeenCalledWith(
                { product_ids: emptyProductIDs },
                mockMetadata,
                expect.any(Function)
            );
            expect(result).toEqual([]);
            expect(mockLogger.error).not.toHaveBeenCalled();
        });

        it('should handle gRPC service errors', async () => {
            // Arrange
            const mockError = new Error('Product service unavailable');

            mockProductStub.getProductByIDs.mockImplementation((params, metadata, callback) => {
                callback(mockError, null);
            });

            // Act & Assert
            await expect(getProductByIDs(mockProductIDs, mockMetadata)).rejects.toThrow(
                'Product service unavailable'
            );

            expect(mockProductStub.getProductByIDs).toHaveBeenCalledWith(
                { product_ids: mockProductIDs },
                mockMetadata,
                expect.any(Function)
            );
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
        });

        it('should handle network timeout errors', async () => {
            // Arrange
            const timeoutError = new Error('DEADLINE_EXCEEDED');

            mockProductStub.getProductByIDs.mockImplementation((params, metadata, callback) => {
                callback(timeoutError, null);
            });

            // Act & Assert
            await expect(getProductByIDs(mockProductIDs, mockMetadata)).rejects.toThrow(
                'DEADLINE_EXCEEDED'
            );

            expect(mockLogger.error).toHaveBeenCalledWith(timeoutError);
        });

        it('should handle null response from service', async () => {
            // Arrange
            mockProductStub.getProductByIDs.mockImplementation((params, metadata, callback) => {
                callback(null, null);
            });

            // Act & Assert
            await expect(getProductByIDs(mockProductIDs, mockMetadata)).rejects.toThrow();
            expect(mockLogger.error).toHaveBeenCalled();
        });

        it('should handle malformed response from service', async () => {
            // Arrange
            const malformedResponse = {
                // Missing product_ids field
                status: 'SUCCESS',
            };

            mockProductStub.getProductByIDs.mockImplementation((params, metadata, callback) => {
                callback(null, malformedResponse);
            });

            // Act
            const result = await getProductByIDs(mockProductIDs, mockMetadata);

            // Assert
            expect(result).toBeUndefined();
            expect(mockLogger.error).not.toHaveBeenCalled();
        });

        it('should pass correct metadata to the service call', async () => {
            // Arrange
            const specificMetadata = {
                authorization: 'Bearer specific-token',
                'user-id': 'user123',
                'request-id': 'req456',
            };

            const mockResponse = {
                product_ids: mockProductIDs,
                status: 'SUCCESS',
            };

            mockProductStub.getProductByIDs.mockImplementation((params, metadata, callback) => {
                callback(null, mockResponse);
            });

            // Act
            await getProductByIDs(mockProductIDs, specificMetadata);

            // Assert
            expect(mockProductStub.getProductByIDs).toHaveBeenCalledWith(
                { product_ids: mockProductIDs },
                specificMetadata,
                expect.any(Function)
            );
        });

        it('should handle large arrays of product IDs', async () => {
            // Arrange
            const largeProductIDArray = Array.from({ length: 1000 }, (_, i) => `prod${i}`);
            const mockResponse = {
                product_ids: largeProductIDArray,
                status: 'SUCCESS',
            };

            mockProductStub.getProductByIDs.mockImplementation((params, metadata, callback) => {
                callback(null, mockResponse);
            });

            // Act
            const result = await getProductByIDs(largeProductIDArray, mockMetadata);

            // Assert
            expect(result).toEqual(largeProductIDArray);
            expect(mockProductStub.getProductByIDs).toHaveBeenCalledWith(
                { product_ids: largeProductIDArray },
                mockMetadata,
                expect.any(Function)
            );
        });

        it('should handle service returning partial results', async () => {
            // Arrange
            const requestedIDs = ['prod1', 'prod2', 'prod3'];
            const partialResponse = {
                product_ids: ['prod1', 'prod3'], // Missing prod2
                status: 'PARTIAL_SUCCESS',
            };

            mockProductStub.getProductByIDs.mockImplementation((params, metadata, callback) => {
                callback(null, partialResponse);
            });

            // Act
            const result = await getProductByIDs(requestedIDs, mockMetadata);

            // Assert
            expect(result).toEqual(['prod1', 'prod3']);
            expect(result).toHaveLength(2);
            expect(mockLogger.error).not.toHaveBeenCalled();
        });

        it('should handle concurrent calls correctly', async () => {
            // Arrange
            const call1IDs = ['prod1', 'prod2'];
            const call2IDs = ['prod3', 'prod4'];
            
            const response1 = { product_ids: ['prod1', 'prod2'], status: 'SUCCESS' };
            const response2 = { product_ids: ['prod3', 'prod4'], status: 'SUCCESS' };

            mockProductStub.getProductByIDs
                .mockImplementationOnce((params, metadata, callback) => {
                    setTimeout(() => callback(null, response1), 10);
                })
                .mockImplementationOnce((params, metadata, callback) => {
                    setTimeout(() => callback(null, response2), 5);
                });

            // Act
            const [result1, result2] = await Promise.all([
                getProductByIDs(call1IDs, mockMetadata),
                getProductByIDs(call2IDs, mockMetadata),
            ]);

            // Assert
            expect(result1).toEqual(['prod1', 'prod2']);
            expect(result2).toEqual(['prod3', 'prod4']);
            expect(mockProductStub.getProductByIDs).toHaveBeenCalledTimes(2);
        });
    });
});