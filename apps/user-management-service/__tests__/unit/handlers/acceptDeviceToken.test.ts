// Mock dependencies
jest.mock('@atc/common', () => ({
    createPlatformEndpoint: jest.fn(),
    errorMessage: {
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        DEVICE_TOKEN: {
            ACCEPTED: 'Device token accepted successfully',
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
    },
}));

jest.mock('../../../src/services/model.service', () => ({
    updateUserByID: jest.fn(),
}));

import { acceptDeviceToken } from '../../../src/handlers/acceptDeviceToken';
import { createPlatformEndpoint, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { status } from '@grpc/grpc-js';
import { updateUserByID } from '../../../src/services/model.service';

describe('Accept Device Token Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
    });

    const mockCall = {
        request: {
            device_token: 'valid-device-token-123',
        },
        user: {
            userID: 'user-123',
        },
    };

    const mockPlatformEndpointResponse = {
        EndpointArn: 'arn:aws:sns:us-east-1:123456789012:app/FCM/MyApp/12345678-1234-1234-1234-123456789012',
    };

    describe('successful device token acceptance', () => {
        it('should accept device token and update user successfully', async () => {
            // Mock successful dependencies
            utilFns.removeEmptyFields.mockReturnValue({
                device_token: 'valid-device-token-123',
            });
            (createPlatformEndpoint as jest.Mock).mockResolvedValue(mockPlatformEndpointResponse);
            (updateUserByID as jest.Mock).mockResolvedValue(undefined);

            await acceptDeviceToken(mockCall as any, mockCallback);

            // Verify utilFns.removeEmptyFields was called
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);

            // Verify createPlatformEndpoint was called with correct device token
            expect(createPlatformEndpoint).toHaveBeenCalledWith('valid-device-token-123');

            // Verify updateUserByID was called with correct parameters
            expect(updateUserByID).toHaveBeenCalledWith('user-123', {
                device_endpoint_arn: 'arn:aws:sns:us-east-1:123456789012:app/FCM/MyApp/12345678-1234-1234-1234-123456789012',
            });

            // Verify successful response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Device token accepted successfully',
                    status: status.OK,
                })
            );
        });

        it('should handle empty device_token field correctly', async () => {
            const mockCallWithEmptyToken = {
                request: {
                    device_token: '',
                    extra_field: '',
                },
                user: {
                    userID: 'user-123',
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                device_token: 'cleaned-token',
            });
            (createPlatformEndpoint as jest.Mock).mockResolvedValue(mockPlatformEndpointResponse);
            (updateUserByID as jest.Mock).mockResolvedValue(undefined);

            await acceptDeviceToken(mockCallWithEmptyToken as any, mockCallback);

            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCallWithEmptyToken.request);
            expect(createPlatformEndpoint).toHaveBeenCalledWith('cleaned-token');
        });
    });

    describe('error handling', () => {
        it('should handle createPlatformEndpoint error', async () => {
            const createPlatformError = new Error('Failed to create platform endpoint');
            
            utilFns.removeEmptyFields.mockReturnValue({
                device_token: 'valid-device-token-123',
            });
            (createPlatformEndpoint as jest.Mock).mockRejectedValue(createPlatformError);

            await acceptDeviceToken(mockCall as any, mockCallback);

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(createPlatformError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                })
            );

            // Verify updateUserByID was not called due to early error
            expect(updateUserByID).not.toHaveBeenCalled();
        });

        it('should handle updateUserByID error', async () => {
            const updateUserError = new Error('Database update failed');
            
            utilFns.removeEmptyFields.mockReturnValue({
                device_token: 'valid-device-token-123',
            });
            (createPlatformEndpoint as jest.Mock).mockResolvedValue(mockPlatformEndpointResponse);
            (updateUserByID as jest.Mock).mockRejectedValue(updateUserError);

            await acceptDeviceToken(mockCall as any, mockCallback);

            // Verify both services were called before error
            expect(createPlatformEndpoint).toHaveBeenCalledWith('valid-device-token-123');
            expect(updateUserByID).toHaveBeenCalledWith('user-123', {
                device_endpoint_arn: mockPlatformEndpointResponse.EndpointArn,
            });

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(updateUserError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                })
            );
        });

        it('should handle utilFns.removeEmptyFields error', async () => {
            const removeEmptyFieldsError = new Error('Field validation failed');
            
            utilFns.removeEmptyFields.mockImplementation(() => {
                throw removeEmptyFieldsError;
            });

            await acceptDeviceToken(mockCall as any, mockCallback);

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(removeEmptyFieldsError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                })
            );

            // Verify subsequent services were not called
            expect(createPlatformEndpoint).not.toHaveBeenCalled();
            expect(updateUserByID).not.toHaveBeenCalled();
        });

        it('should handle unexpected error types', async () => {
            const unexpectedError = 'String error instead of Error object';
            
            utilFns.removeEmptyFields.mockReturnValue({
                device_token: 'valid-device-token-123',
            });
            (createPlatformEndpoint as jest.Mock).mockRejectedValue(unexpectedError);

            await acceptDeviceToken(mockCall as any, mockCallback);

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(unexpectedError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                })
            );
        });
    });

    describe('edge cases', () => {
        it('should handle missing userID in call.user', async () => {
            const mockCallWithoutUserID = {
                request: {
                    device_token: 'valid-device-token-123',
                },
                user: {}, // Missing userID
            };

            utilFns.removeEmptyFields.mockReturnValue({
                device_token: 'valid-device-token-123',
            });
            (createPlatformEndpoint as jest.Mock).mockResolvedValue(mockPlatformEndpointResponse);

            await acceptDeviceToken(mockCallWithoutUserID as any, mockCallback);

            // Should still attempt to call updateUserByID with undefined userID
            expect(updateUserByID).toHaveBeenCalledWith(undefined, {
                device_endpoint_arn: mockPlatformEndpointResponse.EndpointArn,
            });
        });

        it('should handle missing device_token after removeEmptyFields', async () => {
            utilFns.removeEmptyFields.mockReturnValue({}); // No device_token returned
            
            await acceptDeviceToken(mockCall as any, mockCallback);

            // Should attempt to call createPlatformEndpoint with undefined
            expect(createPlatformEndpoint).toHaveBeenCalledWith(undefined);
        });

        it('should handle null EndpointArn response', async () => {
            const mockNullEndpointResponse = {
                EndpointArn: null,
            };

            utilFns.removeEmptyFields.mockReturnValue({
                device_token: 'valid-device-token-123',
            });
            (createPlatformEndpoint as jest.Mock).mockResolvedValue(mockNullEndpointResponse);
            (updateUserByID as jest.Mock).mockResolvedValue(undefined);

            await acceptDeviceToken(mockCall as any, mockCallback);

            expect(updateUserByID).toHaveBeenCalledWith('user-123', {
                device_endpoint_arn: null,
            });

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Device token accepted successfully',
                    status: status.OK,
                })
            );
        });
    });

    describe('function call order and dependencies', () => {
        it('should call functions in correct order', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                device_token: 'valid-device-token-123',
            });
            (createPlatformEndpoint as jest.Mock).mockResolvedValue(mockPlatformEndpointResponse);
            (updateUserByID as jest.Mock).mockResolvedValue(undefined);

            await acceptDeviceToken(mockCall as any, mockCallback);

            // Verify call order
            const removeEmptyFieldsCall = utilFns.removeEmptyFields.mock.invocationCallOrder[0];
            const createPlatformEndpointCall = (createPlatformEndpoint as jest.Mock).mock.invocationCallOrder[0];
            const updateUserByIDCall = (updateUserByID as jest.Mock).mock.invocationCallOrder[0];
            const callbackCall = mockCallback.mock.invocationCallOrder[0];

            expect(removeEmptyFieldsCall).toBeLessThan(createPlatformEndpointCall);
            expect(createPlatformEndpointCall).toBeLessThan(updateUserByIDCall);
            expect(updateUserByIDCall).toBeLessThan(callbackCall);
        });

        it('should not call updateUserByID if createPlatformEndpoint fails', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                device_token: 'valid-device-token-123',
            });
            (createPlatformEndpoint as jest.Mock).mockRejectedValue(new Error('Platform error'));

            await acceptDeviceToken(mockCall as any, mockCallback);

            expect(createPlatformEndpoint).toHaveBeenCalled();
            expect(updateUserByID).not.toHaveBeenCalled();
        });
    });

    describe('callback responses', () => {
        it('should always call callback with null as first parameter on success', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                device_token: 'valid-device-token-123',
            });
            (createPlatformEndpoint as jest.Mock).mockResolvedValue(mockPlatformEndpointResponse);
            (updateUserByID as jest.Mock).mockResolvedValue(undefined);

            await acceptDeviceToken(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null, // First parameter should always be null for gRPC success
                expect.any(Object)
            );
        });

        it('should always call callback with null as first parameter on error', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                device_token: 'valid-device-token-123',
            });
            (createPlatformEndpoint as jest.Mock).mockRejectedValue(new Error('Test error'));

            await acceptDeviceToken(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null, // First parameter should always be null, errors are in response object
                expect.any(Object)
            );
        });

        it('should include correct response structure on success', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                device_token: 'valid-device-token-123',
            });
            (createPlatformEndpoint as jest.Mock).mockResolvedValue(mockPlatformEndpointResponse);
            (updateUserByID as jest.Mock).mockResolvedValue(undefined);

            await acceptDeviceToken(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                {
                    message: 'Device token accepted successfully',
                    status: status.OK,
                }
            );
        });

        it('should include correct response structure on error', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                device_token: 'valid-device-token-123',
            });
            (createPlatformEndpoint as jest.Mock).mockRejectedValue(new Error('Test error'));

            await acceptDeviceToken(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                {
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                }
            );
        });
    });
});