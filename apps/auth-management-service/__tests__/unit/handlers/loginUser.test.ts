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
        },
        USER: {
            LOGIN_FAILED: 'Login failed',
        },
    },
    responseMessage: {
        USER: {
            LOGGED_IN: 'User logged in successfully',
        },
    },
    status: {
        OK: 0,
        ABORTED: 10,
        INTERNAL: 13,
    },
    tokenFns: {
        generateToken: jest.fn(),
    },
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
}));

jest.mock('@atc/db', () => ({
    prismaClient: {
        Prisma: {
            UserCreateInput: {},
        },
    },
}));

import { oAuthRegister } from '../../../src/handlers/oauthRegister';
import { authorizeGoogle } from '../../../src/services/OAuth/google-auth';
import {
    getUserByEmail,
    createUser,
} from '../../../src/services/model-services';

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
            const { tokenFns } = require('@atc/common');
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
            const { tokenFns } = require('@atc/common');
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
