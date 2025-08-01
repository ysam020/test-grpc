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
            ALREADY_VERIFIED: 'User already verified',
            VERIFY_FAILED: 'Failed to verify user',
        },
        TOKEN: {
            INVALID: 'Invalid token',
            EXPIRED: 'Token expired',
            REFRESHED: 'Token refreshed',
        },
        OTP: {
            INVALID: 'Invalid OTP',
        },
        PASSWORD: {
            UPDATED: 'Password updated successfully',
            UPDATE_FAILED: 'Failed to update password',
        },
    },
    responseMessage: {
        USER: {
            LOGGED_IN: 'User logged in successfully',
        },
        EMAIL: {
            EMAIL_SENT: 'Email sent successfully',
            VERIFIED: 'Email verified successfully',
        },
        PASSWORD: {
            UPDATED: 'Password updated successfully',
        },
    },
    status: {
        OK: 0,
        ABORTED: 10,
        INTERNAL: 13,
        NOT_FOUND: 5,
        UNAUTHENTICATED: 16,
        ALREADY_EXISTS: 6,
    },
    tokenFns: {
        generateToken: jest.fn(),
        verifyToken: jest.fn(),
    },
    utilFns: {
        generateRandomNumber: jest.fn(() => 123456),
        createMetadata: jest.fn(() => ({})),
    },
    sendEmail: jest.fn(),
    hashFns: {
        hashValue: jest.fn(),
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
    updateUserData: jest.fn(),
    getAdminDetails: jest.fn(() => ({ id: 'admin-id' })),
    getAllRetailersforPreference: jest.fn(() => [
        { id: 'retailer1' },
        { id: 'retailer2' },
    ]),
    updateUserPreference: jest.fn(),
}));

jest.mock('../../../src/client', () => ({
    notificationStub: {
        CreateNotification: jest.fn((req, meta, cb) => cb(null, {})),
    },
}));

jest.mock('@atc/db', () => ({
    prismaClient: {
        Prisma: {
            UserCreateInput: {},
        },
        NotificationType: {
            REGISTRATION: 'REGISTRATION',
        },
    },
}));

import { oAuthRegister } from '../../../src/handlers/oauthRegister';
import { forgotPassword } from '../../../src/handlers/forgotPassword';
import { refreshToken } from '../../../src/handlers/refreshToken';
import { resendEmail } from '../../../src/handlers/resendEmail';
import { resetPassword } from '../../../src/handlers/resetPassword';
import { verifyUser } from '../../../src/handlers/verifyUser';
import {
    getUserByEmail,
    createUser,
    updateUserData,
    getAdminDetails,
    getAllRetailersforPreference,
    updateUserPreference,
} from '../../../src/services/model-services';

const { sendEmail, tokenFns, hashFns, utilFns } = require('@atc/common');
const { notificationStub } = require('../../../src/client');

// Previous describes remain unchanged...

describe('Verify User Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        process.env.VERIFY_JWT_TOKEN = 'verify-secret';
        process.env.ACCESS_JWT_TOKEN = 'access-token';
        process.env.ACCESS_JWT_EXPIRE = '15m';
        process.env.REFRESH_TOKEN = 'refresh-token';
        process.env.REFRESH_TOKEN_EXPIRE = '7d';
    });

    const mockCall = {
        request: {
            token: 'verify-token',
            otp: 123456,
        },
    };

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        otp: 123456,
        is_verified: false,
        role: 'USER',
        password: 'hashed',
        first_name: 'John',
        last_name: 'Doe',
    };

    it('should verify user and return tokens', async () => {
        tokenFns.verifyToken.mockReturnValue({ email: mockUser.email });
        tokenFns.generateToken.mockReturnValue('jwt-token');
        (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);

        await verifyUser(mockCall as any, mockCallback);

        expect(updateUserData).toHaveBeenCalledWith(mockUser.id, {
            is_verified: true,
            otp: null,
        });
        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'Email verified successfully',
                accessToken: 'jwt-token',
                refreshToken: 'jwt-token',
                status: 0,
                data: expect.objectContaining({
                    id: mockUser.id,
                    email: mockUser.email,
                    first_name: 'John',
                    last_name: 'Doe',
                }),
            }),
        );
    });

    it('should return error if token is invalid', async () => {
        tokenFns.verifyToken.mockReturnValue(null);
        await verifyUser(mockCall as any, mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'Invalid token',
                status: 16,
            }),
        );
    });

    it('should return error if user not found', async () => {
        tokenFns.verifyToken.mockReturnValue({ email: 'x@example.com' });
        (getUserByEmail as jest.Mock).mockResolvedValue(null);
        await verifyUser(mockCall as any, mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'User not found',
                status: 5,
            }),
        );
    });

    it('should return error if already verified', async () => {
        tokenFns.verifyToken.mockReturnValue({ email: mockUser.email });
        (getUserByEmail as jest.Mock).mockResolvedValue({
            ...mockUser,
            is_verified: true,
        });
        await verifyUser(mockCall as any, mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'User already verified',
                status: 6,
            }),
        );
    });

    it('should return error if OTP does not match', async () => {
        tokenFns.verifyToken.mockReturnValue({ email: mockUser.email });
        (getUserByEmail as jest.Mock).mockResolvedValue({
            ...mockUser,
            otp: 999999,
        });
        await verifyUser(mockCall as any, mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'Invalid OTP',
                status: 16,
            }),
        );
    });
});
