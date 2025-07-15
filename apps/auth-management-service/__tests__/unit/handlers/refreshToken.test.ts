import { jest } from '@jest/globals';
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
    AuthProviderEnum: {
        GOOGLE: 'google',
        META: 'meta',
        APPLE: 'apple',
        INTERNAL: 'internal',
    },
    errorMessage: {
        OTHER: {
            BAD_REQUEST: 'Bad request',
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
        USER: {
            LOGIN_FAILED: 'Login failed',
            NOT_FOUND: 'User not found',
            NOT_VERIFIED: 'User not verified',
        },
        TOKEN: {
            INVALID: 'Invalid token',
            EXPIRED: 'Token expired',
            REFRESHED: 'Token refreshed',
        },
    },
    responseMessage: {
        USER: {
            LOGGED_IN: 'User logged in successfully',
        },
        EMAIL: {
            EMAIL_SENT: 'Email sent successfully',
        },
    },
    status: {
        OK: 0,
        ABORTED: 10,
        INTERNAL: 13,
        NOT_FOUND: 5,
        UNAUTHENTICATED: 16,
    },
    tokenFns: {
        generateToken: jest.fn(),
        verifyToken: jest.fn(),
    },
    utilFns: {
        generateRandomNumber: jest.fn(() => 123456),
    },
    sendEmail: jest.fn(),
}));

jest.mock('../../../src/services/OAuth/google-auth', () => ({
    authorizeGoogle: jest.fn(),
}));

jest.mock('../../../src/services/OAuth/fb-auth', () => ({
    authorizeFacebook: jest.fn(),
}));

jest.mock('../../../src/services/OAuth/apple-auth', () => ({
    authorizeApple: jest.fn(),
}));

jest.mock('../../../src/services/model-services', () => ({
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    updateUserData: jest.fn(),
}));

jest.mock('@atc/db', () => ({
    prismaClient: {
        Prisma: {
            UserCreateInput: {},
        },
    },
}));

import { oAuthRegister } from '../../../src/handlers/oauthRegister';
import { forgotPassword } from '../../../src/handlers/forgotPassword';
import { refreshToken } from '../../../src/handlers/refreshToken';
import { authorizeGoogle } from '../../../src/services/OAuth/google-auth';
import {
    getUserByEmail,
    createUser,
    updateUserData,
} from '../../../src/services/model-services';

const { sendEmail, tokenFns } = require('@atc/common');

describe('OAuth Register Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();

        process.env.ACCESS_JWT_TOKEN = 'test-access-token';
        process.env.ACCESS_JWT_EXPIRE = '15m';
        process.env.REFRESH_TOKEN = 'test-refresh-token';
        process.env.REFRESH_TOKEN_EXPIRE = '7d';
    });

    const mockGoogleCall = {
        request: {
            token: 'google-token',
            authProvider: 'google',
            userId: undefined,
            fcmToken: 'fcm-token',
        },
    };

    const mockAuthData = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        picture: 'https://example.com/avatar.jpg',
        auth: 'google',
    };

    const mockExistingUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'USER',
        age: 25,
        address: '123 Main St',
        city: 'Test City',
        no_of_adult: 2,
        no_of_children: 1,
        postcode: '12345',
        phone_number: '1234567890',
    };

    describe('successful OAuth registration', () => {
        it('should register new Google user successfully', async () => {
            const mockAccessToken = 'access-token';
            const mockRefreshToken = 'refresh-token';
            const mockNewUser = { ...mockExistingUser, id: 'new-user-123' };

            (authorizeGoogle as jest.Mock).mockResolvedValue(mockAuthData);
            (getUserByEmail as jest.Mock).mockResolvedValue(null);
            (createUser as jest.Mock).mockResolvedValue(mockNewUser);
            tokenFns.generateToken
                .mockReturnValueOnce(mockAccessToken)
                .mockReturnValueOnce(mockRefreshToken);

            await oAuthRegister(mockGoogleCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User logged in successfully',
                    status: 0,
                    accessToken: mockAccessToken,
                    refreshToken: mockRefreshToken,
                }),
            );
        });

        it('should login existing Google user successfully', async () => {
            const mockAccessToken = 'access-token';
            const mockRefreshToken = 'refresh-token';

            (authorizeGoogle as jest.Mock).mockResolvedValue(mockAuthData);
            (getUserByEmail as jest.Mock).mockResolvedValue(mockExistingUser);
            tokenFns.generateToken
                .mockReturnValueOnce(mockAccessToken)
                .mockReturnValueOnce(mockRefreshToken);

            await oAuthRegister(mockGoogleCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User logged in successfully',
                    status: 0,
                    accessToken: mockAccessToken,
                    refreshToken: mockRefreshToken,
                }),
            );
        });
    });

    describe('OAuth failures', () => {
        it('should return error when OAuth provider fails', async () => {
            (authorizeGoogle as jest.Mock).mockRejectedValueOnce(
                new Error('OAuth failed'),
            );

            await oAuthRegister(mockGoogleCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    status: 10,
                    accessToken: '',
                    refreshToken: '',
                    data: null,
                    message: 'Login failed',
                }),
            );
        });

        it('should return error when OAuth provider returns no data', async () => {
            (authorizeGoogle as jest.Mock).mockResolvedValueOnce(null);

            await oAuthRegister(mockGoogleCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    status: 10,
                    accessToken: '',
                    refreshToken: '',
                    data: null,
                    message: 'Login failed',
                }),
            );
        });

        it('should return error when user creation fails', async () => {
            (authorizeGoogle as jest.Mock).mockResolvedValueOnce(mockAuthData);
            (getUserByEmail as jest.Mock).mockResolvedValueOnce(null);
            (createUser as jest.Mock).mockResolvedValueOnce(null);

            await oAuthRegister(mockGoogleCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    status: 13,
                    accessToken: '',
                    refreshToken: '',
                    data: null,
                    message: 'Login failed',
                }),
            );
        });
    });

    describe('error handling', () => {
        it('should handle database errors gracefully', async () => {
            (authorizeGoogle as jest.Mock).mockResolvedValueOnce(mockAuthData);
            (getUserByEmail as jest.Mock).mockRejectedValueOnce(
                new Error('Database connection failed'),
            );

            await oAuthRegister(mockGoogleCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    status: 10,
                    accessToken: '',
                    refreshToken: '',
                    data: null,
                    message: 'Login failed',
                }),
            );
        });
    });
});

describe('Forgot Password Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        process.env.RESET_JWT_TOKEN = 'reset-token';
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
        is_verified: true,
    };

    it('should return token and send email on valid request', async () => {
        const mockToken = 'reset-token';
        (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
        tokenFns.generateToken.mockReturnValue(mockToken);

        await forgotPassword(mockCall as any, mockCallback);

        expect(updateUserData).toHaveBeenCalled();
        expect(sendEmail).toHaveBeenCalled();
        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'Email sent successfully',
                token: mockToken,
                status: 0,
            }),
        );
    });

    it('should return error if user is not found', async () => {
        (getUserByEmail as jest.Mock).mockResolvedValue(null);

        await forgotPassword(mockCall as any, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                status: 5,
                token: '',
            }),
        );
    });

    it('should return error if user is not verified', async () => {
        const unverifiedUser = { ...mockUser, is_verified: false };
        (getUserByEmail as jest.Mock).mockResolvedValue(unverifiedUser);

        await forgotPassword(mockCall as any, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                status: 5,
                token: '',
            }),
        );
    });

    it('should return internal error on failure', async () => {
        (getUserByEmail as jest.Mock).mockRejectedValue(new Error('DB error'));

        await forgotPassword(mockCall as any, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                status: 13,
                token: '',
            }),
        );
    });
});

describe('Refresh Token Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        process.env.ACCESS_JWT_TOKEN = 'access-secret';
        process.env.ACCESS_JWT_EXPIRE = '15m';
        process.env.REFRESH_TOKEN = 'refresh-secret';
        process.env.REFRESH_TOKEN_EXPIRE = '7d';
    });

    const mockCall = {
        request: {
            refresh_token: 'valid-refresh-token',
        },
    };

    const mockPayload = {
        userID: 'user-123',
        role: 'USER',
        email: 'test@example.com',
    };

    it('should issue new access and refresh tokens on valid refresh token', async () => {
        const newAccessToken = 'new-access-token';
        const newRefreshToken = 'new-refresh-token';

        tokenFns.verifyToken.mockReturnValue(mockPayload);
        tokenFns.generateToken
            .mockReturnValueOnce(newAccessToken)
            .mockReturnValueOnce(newRefreshToken);

        await refreshToken(mockCall as any, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'Token refreshed',
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                status: 0,
            }),
        );
    });

    it('should return unauthenticated if token is invalid', async () => {
        tokenFns.verifyToken.mockReturnValue(null);

        await refreshToken(mockCall as any, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'Invalid token',
                accessToken: '',
                refreshToken: '',
                status: 16,
            }),
        );
    });

    it('should handle TokenExpiredError and return appropriate response', async () => {
        const { TokenExpiredError } = require('jsonwebtoken');
        const tokenExpiredError = new TokenExpiredError(
            'jwt expired',
            new Date(),
        );

        tokenFns.verifyToken.mockImplementation(() => {
            throw tokenExpiredError;
        });

        await refreshToken(mockCall as any, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'Token expired',
                accessToken: '',
                refreshToken: '',
                status: 16,
            }),
        );
    });

    it('should return internal error on other exceptions', async () => {
        tokenFns.verifyToken.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        await refreshToken(mockCall as any, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'Something went wrong',
                accessToken: '',
                refreshToken: '',
                status: 13,
            }),
        );
    });
});
