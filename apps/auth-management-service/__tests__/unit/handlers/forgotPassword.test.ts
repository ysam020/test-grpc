import { status } from '@grpc/grpc-js';

// Mock dependencies
jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));

jest.mock('@atc/common', () => ({
    errorMessage: {
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
        USER: {
            NOT_FOUND: 'User not found',
            NOT_VERIFIED: 'User is not verified, kindly verify your email',
        },
    },
    responseMessage: {
        EMAIL: {
            EMAIL_SENT: 'Email sent successfully',
        },
    },
    tokenFns: {
        generateToken: jest.fn(),
    },
    utilFns: {
        generateRandomNumber: jest.fn(),
    },
    sendEmail: jest.fn(),
}));

jest.mock('../../../src/services/model-services', () => ({
    getUserByEmail: jest.fn(),
    updateUserData: jest.fn(),
}));

import { forgotPassword } from '../../../src/handlers/forgotPassword';
import { getUserByEmail, updateUserData } from '../../../src/services/model-services';

const { tokenFns, utilFns, sendEmail } = require('@atc/common');

describe('Forgot Password Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        
        process.env.RESET_JWT_TOKEN = 'reset-token-secret';
        process.env.RESET_JWT_EXPIRE = '10m';
    });

    const mockCall = {
        request: {
            email: 'test@example.com',
        },
    };

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        is_verified: true,
    };

    describe('successful forgot password', () => {
        it('should send reset password email for verified user', async () => {
            const mockToken = 'reset-token-123';
            const mockOtp = 123456;

            (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
            tokenFns.generateToken.mockReturnValue(mockToken);
            utilFns.generateRandomNumber.mockReturnValue(mockOtp);
            (updateUserData as jest.Mock).mockResolvedValue(true);

            await forgotPassword(mockCall as any, mockCallback);

            expect(getUserByEmail).toHaveBeenCalledWith('test@example.com');
            
            expect(tokenFns.generateToken).toHaveBeenCalledWith(
                { email: 'test@example.com' },
                'reset-token-secret',
                { expiresIn: '10m' }
            );

            expect(utilFns.generateRandomNumber).toHaveBeenCalledWith(100000, 1000000);
            
            expect(updateUserData).toHaveBeenCalledWith('user-123', { otp: mockOtp });
            
            expect(sendEmail).toHaveBeenCalledWith('test@example.com', {
                subject: 'Verify User',
                text: `Reset Password OTP: - ${mockOtp}`,
            });

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Email sent successfully',
                    status: status.OK,
                    token: mockToken,
                })
            );
        });
    });

    describe('user validation failures', () => {
        it('should return error if user is not found', async () => {
            (getUserByEmail as jest.Mock).mockResolvedValue(null);

            await forgotPassword(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User not found',
                    status: status.NOT_FOUND,
                    token: '',
                })
            );

            expect(tokenFns.generateToken).not.toHaveBeenCalled();
            expect(sendEmail).not.toHaveBeenCalled();
        });

        it('should return error if user is not verified', async () => {
            const unverifiedUser = { ...mockUser, is_verified: false };
            (getUserByEmail as jest.Mock).mockResolvedValue(unverifiedUser);

            await forgotPassword(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User is not verified, kindly verify your email',
                    status: status.NOT_FOUND,
                    token: '',
                })
            );

            expect(tokenFns.generateToken).not.toHaveBeenCalled();
            expect(sendEmail).not.toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('should handle database errors gracefully', async () => {
            (getUserByEmail as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

            await forgotPassword(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                    token: '',
                })
            );

            const { logger } = require('@atc/logger');
            expect(logger.error).toHaveBeenCalled();
        });

        it('should handle token generation errors', async () => {
            (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
            tokenFns.generateToken.mockImplementation(() => {
                throw new Error('Token generation failed');
            });

            await forgotPassword(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                    token: '',
                })
            );
        });

        it('should handle updateUserData errors', async () => {
            const mockToken = 'reset-token-123';
            const mockOtp = 123456;

            (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
            tokenFns.generateToken.mockReturnValue(mockToken);
            utilFns.generateRandomNumber.mockReturnValue(mockOtp);
            (updateUserData as jest.Mock).mockRejectedValue(new Error('Update failed'));

            await forgotPassword(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                    token: '',
                })
            );
        });

        it('should handle sendEmail errors', async () => {
            const mockToken = 'reset-token-123';
            const mockOtp = 123456;

            (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
            tokenFns.generateToken.mockReturnValue(mockToken);
            utilFns.generateRandomNumber.mockReturnValue(mockOtp);
            (updateUserData as jest.Mock).mockResolvedValue(true);
            sendEmail.mockImplementation(() => {
                throw new Error('Email sending failed');
            });

            await forgotPassword(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                    token: '',
                })
            );
        });
    });

    describe('edge cases', () => {
        it('should handle missing email in request', async () => {
            const callWithoutEmail = {
                request: {
                    email: '',
                },
            };

            (getUserByEmail as jest.Mock).mockResolvedValue(null);

            await forgotPassword(callWithoutEmail as any, mockCallback);

            expect(getUserByEmail).toHaveBeenCalledWith('');
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User not found',
                    status: status.NOT_FOUND,
                    token: '',
                })
            );
        });

        it('should handle user with null is_verified field', async () => {
            const userWithNullVerified = { ...mockUser, is_verified: null };
            (getUserByEmail as jest.Mock).mockResolvedValue(userWithNullVerified);

            await forgotPassword(mockCall as any, mockCallback);

            // Since !null is true, this should be treated as not verified
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User is not verified, kindly verify your email',
                    status: status.NOT_FOUND,
                    token: '',
                })
            );
        });
    });
});