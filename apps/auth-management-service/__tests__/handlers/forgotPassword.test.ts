// __tests__/handlers/forgotPassword.test.ts
import { jest } from '@jest/globals';
import { status } from '@grpc/grpc-js';
import { forgotPassword } from '../../src/handlers/forgotPassword';
import * as modelServices from '../../src/services/model-services';
import {
    errorMessage,
    responseMessage,
    tokenFns,
    utilFns,
    sendEmail,
} from '@atc/common';

// Mock the model services
jest.mock('../../src/services/model-services');

describe('ForgotPassword Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        mockCallback = jest.fn();
        jest.clearAllMocks();
    });

    describe('Successful forgot password', () => {
        it('should send reset password email successfully', async () => {
            // Arrange
            const mockRequest = {
                email: 'test@example.com',
            };
            mockCall = { request: mockRequest };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                is_verified: true,
            };

            const mockOtp = 123456;
            const mockResetToken = 'reset-token-123';

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );
            (tokenFns.generateToken as jest.Mock).mockReturnValue(
                mockResetToken,
            );
            (utilFns.generateRandomNumber as jest.Mock).mockReturnValue(
                mockOtp,
            );
            (modelServices.updateUserData as jest.Mock).mockResolvedValue(true);
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await forgotPassword(mockCall, mockCallback);

            // Assert
            expect(modelServices.getUserByEmail).toHaveBeenCalledWith(
                'test@example.com',
            );
            expect(tokenFns.generateToken).toHaveBeenCalledWith(
                { email: 'test@example.com' },
                process.env.RESET_JWT_TOKEN,
                { expiresIn: process.env.RESET_JWT_EXPIRE },
            );
            expect(utilFns.generateRandomNumber).toHaveBeenCalledWith(
                100000,
                1000000,
            );
            expect(modelServices.updateUserData).toHaveBeenCalledWith(
                'user-id-123',
                { otp: mockOtp },
            );
            expect(sendEmail).toHaveBeenCalledWith('test@example.com', {
                subject: 'Verify User',
                text: `Reset Password OTP: - ${mockOtp}`,
            });
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.EMAIL.EMAIL_SENT,
                status: status.OK,
                token: mockResetToken,
            });
        });
    });

    describe('User not found', () => {
        it('should return error when user does not exist', async () => {
            // Arrange
            const mockRequest = {
                email: 'nonexistent@example.com',
            };
            mockCall = { request: mockRequest };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(null);

            // Act
            await forgotPassword(mockCall, mockCallback);

            // Assert
            expect(modelServices.getUserByEmail).toHaveBeenCalledWith(
                'nonexistent@example.com',
            );
            expect(tokenFns.generateToken).not.toHaveBeenCalled();
            expect(utilFns.generateRandomNumber).not.toHaveBeenCalled();
            expect(modelServices.updateUserData).not.toHaveBeenCalled();
            expect(sendEmail).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.USER.NOT_FOUND,
                status: status.NOT_FOUND,
                token: '',
            });
        });
    });

    describe('User not verified', () => {
        it('should return error when user is not verified', async () => {
            // Arrange
            const mockRequest = {
                email: 'unverified@example.com',
            };
            mockCall = { request: mockRequest };

            const mockUser = {
                id: 'user-id-123',
                email: 'unverified@example.com',
                is_verified: false,
            };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );

            // Act
            await forgotPassword(mockCall, mockCallback);

            // Assert
            expect(modelServices.getUserByEmail).toHaveBeenCalledWith(
                'unverified@example.com',
            );
            expect(tokenFns.generateToken).not.toHaveBeenCalled();
            expect(utilFns.generateRandomNumber).not.toHaveBeenCalled();
            expect(modelServices.updateUserData).not.toHaveBeenCalled();
            expect(sendEmail).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.USER.NOT_VERIFIED,
                status: status.NOT_FOUND,
                token: '',
            });
        });
    });

    describe('Email sending', () => {
        it('should continue process even if email sending fails', async () => {
            // Arrange
            const mockRequest = {
                email: 'test@example.com',
            };
            mockCall = { request: mockRequest };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                is_verified: true,
            };

            const mockOtp = 123456;
            const mockResetToken = 'reset-token-123';

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );
            (tokenFns.generateToken as jest.Mock).mockReturnValue(
                mockResetToken,
            );
            (utilFns.generateRandomNumber as jest.Mock).mockReturnValue(
                mockOtp,
            );
            (modelServices.updateUserData as jest.Mock).mockResolvedValue(true);
            (sendEmail as jest.Mock).mockRejectedValue(
                new Error('Email service down'),
            );

            // Act
            await forgotPassword(mockCall, mockCallback);

            // Assert
            expect(modelServices.updateUserData).toHaveBeenCalledWith(
                'user-id-123',
                { otp: mockOtp },
            );
            expect(sendEmail).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.EMAIL.EMAIL_SENT,
                status: status.OK,
                token: mockResetToken,
            });
        });
    });

    describe('OTP generation', () => {
        it('should generate OTP within expected range', async () => {
            // Arrange
            const mockRequest = {
                email: 'test@example.com',
            };
            mockCall = { request: mockRequest };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                is_verified: true,
            };

            const mockOtp = 654321;
            const mockResetToken = 'reset-token-123';

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );
            (tokenFns.generateToken as jest.Mock).mockReturnValue(
                mockResetToken,
            );
            (utilFns.generateRandomNumber as jest.Mock).mockReturnValue(
                mockOtp,
            );
            (modelServices.updateUserData as jest.Mock).mockResolvedValue(true);
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await forgotPassword(mockCall, mockCallback);

            // Assert
            expect(utilFns.generateRandomNumber).toHaveBeenCalledWith(
                100000,
                1000000,
            );
            expect(modelServices.updateUserData).toHaveBeenCalledWith(
                'user-id-123',
                { otp: mockOtp },
            );
            expect(sendEmail).toHaveBeenCalledWith('test@example.com', {
                subject: 'Verify User',
                text: `Reset Password OTP: - ${mockOtp}`,
            });
        });
    });

    describe('Error handling', () => {
        it('should handle database errors gracefully', async () => {
            // Arrange
            const mockRequest = {
                email: 'test@example.com',
            };
            mockCall = { request: mockRequest };

            (modelServices.getUserByEmail as jest.Mock).mockRejectedValue(
                new Error('Database error'),
            );

            // Act
            await forgotPassword(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
                token: '',
            });
        });

        it('should handle token generation errors', async () => {
            // Arrange
            const mockRequest = {
                email: 'test@example.com',
            };
            mockCall = { request: mockRequest };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                is_verified: true,
            };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );
            (tokenFns.generateToken as jest.Mock).mockImplementation(() => {
                throw new Error('Token generation failed');
            });

            // Act
            await forgotPassword(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
                token: '',
            });
        });

        it('should handle updateUserData errors', async () => {
            // Arrange
            const mockRequest = {
                email: 'test@example.com',
            };
            mockCall = { request: mockRequest };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                is_verified: true,
            };

            const mockOtp = 123456;
            const mockResetToken = 'reset-token-123';

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );
            (tokenFns.generateToken as jest.Mock).mockReturnValue(
                mockResetToken,
            );
            (utilFns.generateRandomNumber as jest.Mock).mockReturnValue(
                mockOtp,
            );
            (modelServices.updateUserData as jest.Mock).mockRejectedValue(
                new Error('Update failed'),
            );

            // Act
            await forgotPassword(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
                token: '',
            });
        });
    });

    describe('Input validation', () => {
        it('should handle empty email', async () => {
            // Arrange
            const mockRequest = {
                email: '',
            };
            mockCall = { request: mockRequest };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(null);

            // Act
            await forgotPassword(mockCall, mockCallback);

            // Assert
            expect(modelServices.getUserByEmail).toHaveBeenCalledWith('');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.USER.NOT_FOUND,
                status: status.NOT_FOUND,
                token: '',
            });
        });
    });
});
