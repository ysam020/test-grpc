// Mock dependencies
jest.mock('@atc/common', () => ({
    errorMessage: {
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        OTHER: {
            DATA_FOUND: 'Data found successfully',
        },
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

jest.mock('../../../src/services/model.service', () => ({
    monthlyActiveUsersCount: jest.fn(),
}));

import { getMonthlyActiveUsersCount } from '../../../src/handlers/getMonthlyActiveUsersCount';
import { logger } from '@atc/logger';
import { status } from '@grpc/grpc-js';
import { monthlyActiveUsersCount } from '../../../src/services/model.service';

describe('Get Monthly Active Users Count Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
    });

    const mockCall = {
        request: {}, // Empty request for this handler
        user: {
            userID: 'user-123',
            role: 'USER',
        },
    };

    describe('successful count retrieval', () => {
        it('should return monthly active users count successfully', async () => {
            const mockCount = 1250;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            // Verify service call
            expect(monthlyActiveUsersCount).toHaveBeenCalledWith();

            // Verify successful response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Data found successfully',
                    status: status.OK,
                    data: { count: 1250 },
                })
            );
        });

        it('should handle zero count correctly', async () => {
            const mockCount = 0;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(monthlyActiveUsersCount).toHaveBeenCalledWith();
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Data found successfully',
                    status: status.OK,
                    data: { count: 0 },
                })
            );
        });

        it('should handle large count numbers', async () => {
            const mockCount = 999999;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Data found successfully',
                    status: status.OK,
                    data: { count: 999999 },
                })
            );
        });

        it('should handle decimal count numbers', async () => {
            const mockCount = 123.5; // Unlikely but possible with certain counting methods
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Data found successfully',
                    status: status.OK,
                    data: { count: 123.5 },
                })
            );
        });

        it('should work regardless of user role', async () => {
            const mockCallAdmin = {
                request: {},
                user: {
                    userID: 'admin-123',
                    role: 'ADMIN',
                },
            };

            const mockCount = 500;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCallAdmin as any, mockCallback);

            expect(monthlyActiveUsersCount).toHaveBeenCalledWith();
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Data found successfully',
                    status: status.OK,
                    data: { count: 500 },
                })
            );
        });

        it('should work with empty user context', async () => {
            const mockCallNoUser = {
                request: {},
                user: {},
            };

            const mockCount = 750;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCallNoUser as any, mockCallback);

            expect(monthlyActiveUsersCount).toHaveBeenCalledWith();
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Data found successfully',
                    status: status.OK,
                    data: { count: 750 },
                })
            );
        });
    });

    describe('error handling', () => {
        it('should handle monthlyActiveUsersCount service error', async () => {
            const serviceError = new Error('Database connection failed');
            (monthlyActiveUsersCount as jest.Mock).mockRejectedValue(serviceError);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            // Verify service call was attempted
            expect(monthlyActiveUsersCount).toHaveBeenCalledWith();

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(serviceError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                    data: null,
                })
            );
        });

        it('should handle database timeout errors', async () => {
            const timeoutError = new Error('ETIMEDOUT: Database query timeout');
            (monthlyActiveUsersCount as jest.Mock).mockRejectedValue(timeoutError);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(logger.error).toHaveBeenCalledWith(timeoutError);
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                    data: null,
                })
            );
        });

        it('should handle database connection errors', async () => {
            const connectionError = new Error('ECONNREFUSED: Connection refused');
            (monthlyActiveUsersCount as jest.Mock).mockRejectedValue(connectionError);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(logger.error).toHaveBeenCalledWith(connectionError);
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                    data: null,
                })
            );
        });

        it('should handle unexpected error types', async () => {
            const unexpectedError = 'String error instead of Error object';
            (monthlyActiveUsersCount as jest.Mock).mockRejectedValue(unexpectedError);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(logger.error).toHaveBeenCalledWith(unexpectedError);
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                    data: null,
                })
            );
        });

        it('should handle null/undefined errors', async () => {
            const nullError = null;
            (monthlyActiveUsersCount as jest.Mock).mockRejectedValue(nullError);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(logger.error).toHaveBeenCalledWith(nullError);
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                    data: null,
                })
            );
        });

        it('should handle service returning rejected promise with no error', async () => {
            (monthlyActiveUsersCount as jest.Mock).mockRejectedValue(undefined);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(logger.error).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                    data: null,
                })
            );
        });
    });

    describe('edge cases and unusual values', () => {
        it('should handle negative count values', async () => {
            const mockCount = -5;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Data found successfully',
                    status: status.OK,
                    data: { count: -5 },
                })
            );
        });

        it('should handle null count value', async () => {
            const mockCount = null;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Data found successfully',
                    status: status.OK,
                    data: { count: null },
                })
            );
        });

        it('should handle undefined count value', async () => {
            const mockCount = undefined;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Data found successfully',
                    status: status.OK,
                    data: { count: undefined },
                })
            );
        });

        it('should handle string count value', async () => {
            const mockCount = '123';
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Data found successfully',
                    status: status.OK,
                    data: { count: '123' },
                })
            );
        });

        it('should handle boolean count value', async () => {
            const mockCount = true;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Data found successfully',
                    status: status.OK,
                    data: { count: true },
                })
            );
        });

        it('should handle object count value', async () => {
            const mockCount = { value: 150, metadata: 'test' };
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Data found successfully',
                    status: status.OK,
                    data: { count: { value: 150, metadata: 'test' } },
                })
            );
        });
    });

    describe('request validation', () => {
        it('should handle missing request object', async () => {
            const mockCallNoRequest = {
                user: {
                    userID: 'user-123',
                    role: 'USER',
                },
            };

            const mockCount = 300;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCallNoRequest as any, mockCallback);

            // Should work normally since request content is not used
            expect(monthlyActiveUsersCount).toHaveBeenCalledWith();
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Data found successfully',
                    status: status.OK,
                    data: { count: 300 },
                })
            );
        });

        it('should handle request with extra parameters', async () => {
            const mockCallExtraParams = {
                request: {
                    extraParam: 'should-be-ignored',
                    anotherParam: 123,
                },
                user: {
                    userID: 'user-123',
                    role: 'USER',
                },
            };

            const mockCount = 400;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCallExtraParams as any, mockCallback);

            // Should work normally and ignore extra parameters
            expect(monthlyActiveUsersCount).toHaveBeenCalledWith();
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Data found successfully',
                    status: status.OK,
                    data: { count: 400 },
                })
            );
        });

        it('should handle completely empty call object', async () => {
            const mockCallEmpty = {};

            const mockCount = 200;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCallEmpty as any, mockCallback);

            expect(monthlyActiveUsersCount).toHaveBeenCalledWith();
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Data found successfully',
                    status: status.OK,
                    data: { count: 200 },
                })
            );
        });
    });

    describe('service method validation', () => {
        it('should call monthlyActiveUsersCount with no parameters', async () => {
            const mockCount = 100;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            // Verify the service is called with no arguments
            expect(monthlyActiveUsersCount).toHaveBeenCalledWith();
            expect(monthlyActiveUsersCount).toHaveBeenCalledTimes(1);
        });

        it('should only call monthlyActiveUsersCount once per request', async () => {
            const mockCount = 850;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(monthlyActiveUsersCount).toHaveBeenCalledTimes(1);
        });

        it('should not cache results between calls', async () => {
            // First call
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValueOnce(100);
            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenNthCalledWith(
                1,
                null,
                expect.objectContaining({
                    data: { count: 100 },
                })
            );

            // Second call with different result
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValueOnce(200);
            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenNthCalledWith(
                2,
                null,
                expect.objectContaining({
                    data: { count: 200 },
                })
            );

            expect(monthlyActiveUsersCount).toHaveBeenCalledTimes(2);
        });
    });

    describe('callback responses', () => {
        it('should always call callback with null as first parameter on success', async () => {
            const mockCount = 500;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null, // First parameter should always be null for gRPC success
                expect.any(Object)
            );
        });

        it('should always call callback with null as first parameter on error', async () => {
            (monthlyActiveUsersCount as jest.Mock).mockRejectedValue(new Error('Test error'));

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null, // First parameter should always be null, errors are in response object
                expect.any(Object)
            );
        });

        it('should include correct response structure on success', async () => {
            const mockCount = 1000;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                {
                    message: 'Data found successfully',
                    status: status.OK,
                    data: { count: 1000 },
                }
            );
        });

        it('should include correct response structure on error', async () => {
            (monthlyActiveUsersCount as jest.Mock).mockRejectedValue(new Error('Service error'));

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                {
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                    data: null,
                }
            );
        });

        it('should always include data field in response', async () => {
            // Test success case
            const mockCount = 123;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: expect.anything(), // Should have data field
                })
            );

            jest.clearAllMocks();

            // Test error case
            (monthlyActiveUsersCount as jest.Mock).mockRejectedValue(new Error('Test error'));

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: null, // Should have data field set to null
                })
            );
        });

        it('should always include status and message fields', async () => {
            const mockCount = 456;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: expect.any(String),
                    status: expect.any(Number),
                    data: expect.anything(),
                })
            );
        });
    });

    describe('function execution flow', () => {
        it('should execute in correct order', async () => {
            const mockCount = 789;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            // Verify call order
            const serviceCall = (monthlyActiveUsersCount as jest.Mock).mock.invocationCallOrder[0];
            const callbackCall = mockCallback.mock.invocationCallOrder[0];

            expect(serviceCall).toBeLessThan(callbackCall);
        });

        it('should not call callback before service completes', async () => {
            let serviceResolver: (value: number) => void;
            const servicePromise = new Promise<number>((resolve) => {
                serviceResolver = resolve;
            });

            (monthlyActiveUsersCount as jest.Mock).mockReturnValue(servicePromise);

            const handlerPromise = getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            // Verify callback not called yet
            expect(mockCallback).not.toHaveBeenCalled();

            // Resolve service call
            serviceResolver!(600);
            await handlerPromise;

            // Now callback should be called
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: { count: 600 },
                })
            );
        });

        it('should handle service method that resolves immediately', async () => {
            const mockCount = 999;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(mockCount);

            const startTime = Date.now();
            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);
            const endTime = Date.now();

            // Should complete quickly
            expect(endTime - startTime).toBeLessThan(100);
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: { count: 999 },
                })
            );
        });
    });

    describe('data integrity', () => {
        it('should preserve exact count value returned by service', async () => {
            const exactCount = 12345;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(exactCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: { count: 12345 }, // Exact value preservation
                })
            );
        });

        it('should not modify count value', async () => {
            const originalCount = 54321;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(originalCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            // Verify the count is not modified, transformed, or rounded
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: { count: originalCount },
                })
            );
        });

        it('should handle precision for decimal numbers', async () => {
            const preciseCount = 123.456789;
            (monthlyActiveUsersCount as jest.Mock).mockResolvedValue(preciseCount);

            await getMonthlyActiveUsersCount(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: { count: 123.456789 }, // Preserve precision
                })
            );
        });
    });
});