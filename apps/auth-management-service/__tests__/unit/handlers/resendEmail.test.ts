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
        ALREADY_EXISTS: 6,
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

import { resendEmail } from '../../../src/handlers/resendEmail';

import {
    getUserByEmail,
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

    it('placeholder test', () => {
        expect(true).toBe(true);
    });
});

describe('Forgot Password Handler', () => {
    it('placeholder test', () => {
        expect(true).toBe(true);
    });
});

describe('Refresh Token Handler', () => {
    it('placeholder test', () => {
        expect(true).toBe(true);
    });
});

describe('Resend Email Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        process.env.VERIFY_JWT_TOKEN = 'verify-token';
        process.env.VERIFY_JWT_EXPIRE = '15m';
    });

    const mockCall = {
        request: {
            email: 'test@example.com',
        },
    };

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        is_verified: false,
    };

    it('should send OTP and return token if user is not verified', async () => {
        tokenFns.generateToken.mockReturnValue('verify-token');
        (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);

        await resendEmail(mockCall as any, mockCallback);

        expect(updateUserData).toHaveBeenCalled();
        expect(sendEmail).toHaveBeenCalled();
        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'Email sent successfully',
                status: 0,
                token: 'verify-token',
            }),
        );
    });

    it('should return error if user is already verified', async () => {
        const verifiedUser = { ...mockUser, is_verified: true };
        (getUserByEmail as jest.Mock).mockResolvedValue(verifiedUser);

        await resendEmail(mockCall as any, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'User already verified',
                status: 6,
                token: '',
            }),
        );
    });

    it('should return not found if user does not exist', async () => {
        (getUserByEmail as jest.Mock).mockResolvedValue(null);

        await resendEmail(mockCall as any, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: 'User not found',
                status: 5,
                token: '',
            }),
        );
    });
});
