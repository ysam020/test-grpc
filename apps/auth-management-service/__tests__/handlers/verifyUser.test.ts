// __tests__/handlers/verifyUser.test.ts
import { jest } from '@jest/globals';
import { status } from '@grpc/grpc-js';
import { verifyUser } from '../../src/handlers/verifyUser';
import * as modelServices from '../../src/services/model-services';
import {
    errorMessage,
    responseMessage,
    tokenFns,
    UserRoleEnum,
} from '@atc/common';

// Mock the model services
jest.mock('../../src/services/model-services');

describe('VerifyUser Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        mockCallback = jest.fn();
        jest.clearAllMocks();
    });

    describe('Successful user verification', () => {
        it('should verify user successfully with valid token and OTP', async () => {
            // Arrange
            const mockRequest = {
                token: 'valid-token',
                otp: 123456,
            };
            mockCall = { request: mockRequest };

            const mockDecodedToken = {
                email: 'test@example.com',
            };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                otp: 123456,
                is_verified: false,
                role: UserRoleEnum.USER,
                first_name: 'John',
                last_name: 'Doe',
                password: 'hashedPassword',
            };

            const mockUpdatedUser = {
                ...mockUser,
                is_verified: true,
                otp: null,
            };

            (tokenFns.verifyToken as jest.Mock).mockReturnValue(
                mockDecodedToken,
            );
            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );
            (modelServices.updateUserData as jest.Mock).mockResolvedValue(
                mockUpdatedUser,
            );
            (tokenFns.generateToken as jest.Mock)
                .mockReturnValueOnce('mock-access-token')
                .mockReturnValueOnce('mock-refresh-token');

            // Act
            await verifyUser(mockCall, mockCallback);

            // Assert
            expect(tokenFns.verifyToken).toHaveBeenCalledWith(
                'valid-token',
                process.env.ACCESS_JWT_TOKEN,
            );
            expect(modelServices.getUserByEmail).toHaveBeenCalledWith(
                'test@example.com',
            );
            expect(modelServices.updateUserData).toHaveBeenCalledWith(
                'user-id-123',
                {
                    is_verified: true,
                    otp: null,
                },
            );
            expect(tokenFns.generateToken).toHaveBeenCalledTimes(2);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.USER.VERIFIED,
                data: expect.objectContaining({
                    id: 'user-id-123',
                    email: 'test@example.com',
                    first_name: 'John',
                    last_name: 'Doe',
                    role: UserRoleEnum.USER,
                }),
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
                status: status.OK,
            });
        });
    });

    describe('Invalid token', () => {
        it('should return error when token is invalid', async () => {
            // Arrange
            const mockRequest = {
                token: 'invalid-token',
                otp: 123456,
            };
            mockCall = { request: mockRequest };

            (tokenFns.verifyToken as jest.Mock).mockImplementation(() => {
                throw new Error('Invalid token');
            });

            // Act
            await verifyUser(mockCall, mockCallback);

            // Assert
            expect(tokenFns.verifyToken).toHaveBeenCalledWith(
                'invalid-token',
                process.env.ACCESS_JWT_TOKEN,
            );
            expect(modelServices.getUserByEmail).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.TOKEN.INVALID,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.UNAUTHENTICATED,
            });
        });

        it('should return error when token is expired', async () => {
            // Arrange
            const mockRequest = {
                token: 'expired-token',
                otp: 123456,
            };
            mockCall = { request: mockRequest };

            (tokenFns.verifyToken as jest.Mock).mockImplementation(() => {
                const error = new Error('Token expired');
                error.name = 'TokenExpiredError';
                throw error;
            });

            // Act
            await verifyUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.TOKEN.EXPIRED,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.UNAUTHENTICATED,
            });
        });
    });

    describe('User not found', () => {
        it('should return error when user does not exist', async () => {
            // Arrange
            const mockRequest = {
                token: 'valid-token',
                otp: 123456,
            };
            mockCall = { request: mockRequest };

            const mockDecodedToken = {
                email: 'nonexistent@example.com',
            };

            (tokenFns.verifyToken as jest.Mock).mockReturnValue(
                mockDecodedToken,
            );
            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(null);

            // Act
            await verifyUser(mockCall, mockCallback);

            // Assert
            expect(modelServices.getUserByEmail).toHaveBeenCalledWith(
                'nonexistent@example.com',
            );
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.USER.NOT_FOUND,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.NOT_FOUND,
            });
        });
    });

    describe('Invalid OTP', () => {
        it('should return error when OTP does not match', async () => {
            // Arrange
            const mockRequest = {
                token: 'valid-token',
                otp: 999999,
            };
            mockCall = { request: mockRequest };

            const mockDecodedToken = {
                email: 'test@example.com',
            };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                otp: 123456, // Different OTP
                is_verified: false,
            };

            (tokenFns.verifyToken as jest.Mock).mockReturnValue(
                mockDecodedToken,
            );
            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );

            // Act
            await verifyUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTP.INVALID,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.UNAUTHENTICATED,
            });
        });

        it('should return error when OTP is null', async () => {
            // Arrange
            const mockRequest = {
                token: 'valid-token',
                otp: 123456,
            };
            mockCall = { request: mockRequest };

            const mockDecodedToken = {
                email: 'test@example.com',
            };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                otp: null,
                is_verified: false,
            };

            (tokenFns.verifyToken as jest.Mock).mockReturnValue(
                mockDecodedToken,
            );
            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );

            // Act
            await verifyUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTP.INVALID,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.UNAUTHENTICATED,
            });
        });
    });

    describe('User already verified', () => {
        it('should return error when user is already verified', async () => {
            // Arrange
            const mockRequest = {
                token: 'valid-token',
                otp: 123456,
            };
            mockCall = { request: mockRequest };

            const mockDecodedToken = {
                email: 'test@example.com',
            };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                otp: 123456,
                is_verified: true, // Already verified
            };

            (tokenFns.verifyToken as jest.Mock).mockReturnValue(
                mockDecodedToken,
            );
            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );

            // Act
            await verifyUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.USER.ALREADY_VERIFIED,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.ALREADY_EXISTS,
            });
        });
    });

    describe('Error handling', () => {
        it('should handle database errors gracefully', async () => {
            // Arrange
            const mockRequest = {
                token: 'valid-token',
                otp: 123456,
            };
            mockCall = { request: mockRequest };

            const mockDecodedToken = {
                email: 'test@example.com',
            };

            (tokenFns.verifyToken as jest.Mock).mockReturnValue(
                mockDecodedToken,
            );
            (modelServices.getUserByEmail as jest.Mock).mockRejectedValue(
                new Error('Database error'),
            );

            // Act
            await verifyUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.INTERNAL,
            });
        });

        it('should handle update user data errors', async () => {
            // Arrange
            const mockRequest = {
                token: 'valid-token',
                otp: 123456,
            };
            mockCall = { request: mockRequest };

            const mockDecodedToken = {
                email: 'test@example.com',
            };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                otp: 123456,
                is_verified: false,
            };

            (tokenFns.verifyToken as jest.Mock).mockReturnValue(
                mockDecodedToken,
            );
            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );
            (modelServices.updateUserData as jest.Mock).mockRejectedValue(
                new Error('Update failed'),
            );

            // Act
            await verifyUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.INTERNAL,
            });
        });
    });

    describe('Token generation', () => {
        it('should handle token generation errors', async () => {
            // Arrange
            const mockRequest = {
                token: 'valid-token',
                otp: 123456,
            };
            mockCall = { request: mockRequest };

            const mockDecodedToken = {
                email: 'test@example.com',
            };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                otp: 123456,
                is_verified: false,
                role: UserRoleEnum.USER,
            };

            const mockUpdatedUser = {
                ...mockUser,
                is_verified: true,
                otp: null,
            };

            (tokenFns.verifyToken as jest.Mock).mockReturnValue(
                mockDecodedToken,
            );
            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );
            (modelServices.updateUserData as jest.Mock).mockResolvedValue(
                mockUpdatedUser,
            );
            (tokenFns.generateToken as jest.Mock).mockImplementation(() => {
                throw new Error('Token generation failed');
            });

            // Act
            await verifyUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.INTERNAL,
            });
        });
    });
});
