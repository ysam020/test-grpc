// Mock dependencies
jest.mock('@atc/db', () => ({
    prismaClient: {
        user: {
            create: jest.fn(),
            findUnique: jest.fn(),
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

jest.mock('@atc/common', () => ({
    errorMessage: {
        USER: {
            ALREADY_EXISTS: 'User already exists',
            REGISTER_FAILED: 'User creation failed',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        USER: {
            REGISTERED: 'User created successfully',
        },
    },
    hashFns: {
        hashValue: jest.fn(),
    },
    utilFns: {
        generateRandomNumber: jest.fn(),
    },
    tokenFns: {
        generateToken: jest.fn(),
    },
    sendEmail: jest.fn(),
}));

jest.mock('../../../src/services/model-services', () => ({
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
}));

import { registerUser } from '../../../src/handlers/registerUser';
import {
    getUserByEmail,
    createUser,
} from '../../../src/services/model-services';

const { hashFns, utilFns, tokenFns, sendEmail } = require('@atc/common');

describe('Register User Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();

        process.env.VERIFY_JWT_TOKEN = 'test-verify-token';
        process.env.VERIFY_JWT_EXPIRE = '24h';
    });

    const mockCall = {
        request: {
            email: 'test@example.com',
            password: 'password123',
        },
    };

    describe('successful registration', () => {
        it('should register new user successfully', async () => {
            const mockHashedPassword = 'hashed-password';
            const mockToken = 'verification-token';
            const mockNewUser = {
                id: 'user-123',
                email: 'test@example.com',
                first_name: '',
                last_name: '',
                is_verified: false,
            };

            (getUserByEmail as jest.Mock).mockResolvedValue(null);
            hashFns.hashValue.mockResolvedValue(mockHashedPassword);
            utilFns.generateRandomNumber.mockReturnValue(123456);
            createUser.mockResolvedValue(mockNewUser);
            tokenFns.generateToken.mockReturnValue(mockToken);
            sendEmail.mockReturnValue(undefined);

            await registerUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    status: 0,
                    token: mockToken,
                }),
            );
        });
    });

    describe('user already exists', () => {
        it('should return error when user already exists', async () => {
            const existingUser = {
                id: 'existing-user',
                email: 'test@example.com',
            };

            getUserByEmail.mockResolvedValue(existingUser);

            await registerUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    status: 6,
                    token: '',
                }),
            );
        });
    });

    describe('error handling', () => {
        it('should handle database errors gracefully', async () => {
            const mockError = new Error('Database connection failed');
            getUserByEmail.mockRejectedValue(mockError);

            await registerUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    status: 13,
                    token: '',
                }),
            );
        });
    });
});
