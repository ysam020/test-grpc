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
        USER: {
            NOT_REGISTERED: 'User not registered',
            ROLE_MISMATCH: 'User role does not match the specified role',
            NOT_VERIFIED: 'User is not verified, kindly verify your email',
            LOGIN_FAILED: 'Failed to login user',
        },
        PASSWORD: {
            INVALID: 'Invalid Password',
        },
    },
    responseMessage: {
        USER: {
            LOGGED_IN: 'User logged in successfully',
        },
    },
    UserRoleEnum: {
        USER: 'USER',
        ADMIN: 'ADMIN',
    },
    tokenFns: {
        generateToken: jest.fn(),
    },
    hashFns: {
        compareHash: jest.fn(),
    },
}));

jest.mock('../../../src/services/model-services', () => ({
    getUserByEmail: jest.fn(),
    addUserLoginActivity: jest.fn(),
}));

import { loginUser } from '../../../src/handlers/loginUser';
import { getUserByEmail, addUserLoginActivity } from '../../../src/services/model-services';

const { tokenFns, hashFns } = require('@atc/common');

describe('Login User Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        
        process.env.ACCESS_JWT_TOKEN = 'access-token-secret';
        process.env.ACCESS_JWT_EXPIRE = '15m';
        process.env.REFRESH_TOKEN = 'refresh-token-secret';
        process.env.REFRESH_TOKEN_EXPIRE = '7d';
    });

    const mockCall = {
        request: {
            email: 'test@example.com',
            password: 'password123',
            role: 'USER',
        },
    };

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'USER',
        is_verified: true,
        first_name: 'John',
        last_name: 'Doe',
        age: 25,
        address: '123 Main St',
        city: 'Test City',
        no_of_adult: 2,
        no_of_children: 1,
        postcode: '12345',
        phone_number: '1234567890',
    };

    describe('successful login', () => {
        it('should login user successfully with complete profile', async () => {
            const mockAccessToken = 'access-token-123';
            const mockRefreshToken = 'refresh-token-123';

            (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(true);
            tokenFns.generateToken
                .mockReturnValueOnce(mockAccessToken)
                .mockReturnValueOnce(mockRefreshToken);
            (addUserLoginActivity as jest.Mock).mockResolvedValue(true);

            await loginUser(mockCall as any, mockCallback);

            expect(getUserByEmail).toHaveBeenCalledWith('test@example.com');
            expect(hashFns.compareHash).toHaveBeenCalledWith('password123', 'hashed-password');
            
            expect(tokenFns.generateToken).toHaveBeenCalledTimes(2);
            expect(tokenFns.generateToken).toHaveBeenNthCalledWith(
                1,
                {
                    userID: 'user-123',
                    role: 'USER',
                    email: 'test@example.com',
                },
                'access-token-secret',
                { expiresIn: '15m' }
            );
            expect(tokenFns.generateToken).toHaveBeenNthCalledWith(
                2,
                {
                    userID: 'user-123',
                    role: 'USER',
                    email: 'test@example.com',
                },
                'refresh-token-secret',
                { expiresIn: '7d' }
            );

            expect(addUserLoginActivity).toHaveBeenCalledWith('user-123');

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User logged in successfully',
                    status: status.OK,
                    accessToken: mockAccessToken,
                    refreshToken: mockRefreshToken,
                    data: {
                        id: 'user-123',
                        email: 'test@example.com',
                        first_name: 'John',
                        last_name: 'Doe',
                        sample_registered: true, // All required fields are present
                    },
                })
            );
        });

        it('should login user with incomplete profile (sample_registered: false)', async () => {
            const incompleteUser = {
                ...mockUser,
                age: null,
                address: null,
            };

            (getUserByEmail as jest.Mock).mockResolvedValue(incompleteUser);
            hashFns.compareHash.mockResolvedValue(true);
            tokenFns.generateToken
                .mockReturnValueOnce('access-token')
                .mockReturnValueOnce('refresh-token');

            await loginUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: expect.objectContaining({
                        sample_registered: false, // Missing required fields
                    }),
                })
            );
        });

        it('should not add login activity for admin users', async () => {
            const adminUser = { ...mockUser, role: 'ADMIN' };
            const callWithAdminRole = {
                request: {
                    ...mockCall.request,
                    role: 'ADMIN',
                },
            };

            (getUserByEmail as jest.Mock).mockResolvedValue(adminUser);
            hashFns.compareHash.mockResolvedValue(true);
            tokenFns.generateToken
                .mockReturnValueOnce('access-token')
                .mockReturnValueOnce('refresh-token');

            await loginUser(callWithAdminRole as any, mockCallback);

            expect(addUserLoginActivity).not.toHaveBeenCalled();
        });
    });

    describe('authentication failures', () => {
        it('should return error when user is not registered', async () => {
            (getUserByEmail as jest.Mock).mockResolvedValue(null);

            await loginUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User not registered',
                    status: status.NOT_FOUND,
                    data: null,
                    accessToken: '',
                    refreshToken: '',
                })
            );

            expect(hashFns.compareHash).not.toHaveBeenCalled();
            expect(tokenFns.generateToken).not.toHaveBeenCalled();
        });

        it('should return error when user role does not match', async () => {
            const userWithDifferentRole = { ...mockUser, role: 'ADMIN' };
            (getUserByEmail as jest.Mock).mockResolvedValue(userWithDifferentRole);

            await loginUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User role does not match the specified role',
                    status: status.UNAUTHENTICATED,
                    data: null,
                    accessToken: '',
                    refreshToken: '',
                })
            );

            expect(hashFns.compareHash).not.toHaveBeenCalled();
        });

        it('should return error when user is not verified', async () => {
            const unverifiedUser = { ...mockUser, is_verified: false };
            (getUserByEmail as jest.Mock).mockResolvedValue(unverifiedUser);

            await loginUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User is not verified, kindly verify your email',
                    status: status.UNAUTHENTICATED,
                    data: null,
                    accessToken: '',
                    refreshToken: '',
                })
            );

            expect(hashFns.compareHash).not.toHaveBeenCalled();
        });

        it('should return error when password is invalid', async () => {
            (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(false);

            await loginUser(mockCall as any, mockCallback);

            expect(hashFns.compareHash).toHaveBeenCalledWith('password123', 'hashed-password');
            
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Invalid Password',
                    status: status.UNAUTHENTICATED,
                    data: null,
                    accessToken: '',
                    refreshToken: '',
                })
            );

            expect(tokenFns.generateToken).not.toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('should handle database errors gracefully', async () => {
            (getUserByEmail as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

            await loginUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Failed to login user',
                    status: status.INTERNAL,
                    data: null,
                    accessToken: '',
                    refreshToken: '',
                })
            );

            const { logger } = require('@atc/logger');
            expect(logger.error).toHaveBeenCalled();
        });

        it('should handle password comparison errors', async () => {
            (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockRejectedValue(new Error('Hash comparison failed'));

            await loginUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Failed to login user',
                    status: status.INTERNAL,
                    data: null,
                    accessToken: '',
                    refreshToken: '',
                })
            );
        });

        it('should handle token generation errors', async () => {
            (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(true);
            tokenFns.generateToken.mockImplementation(() => {
                throw new Error('Token generation failed');
            });

            await loginUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Failed to login user',
                    status: status.INTERNAL,
                    data: null,
                    accessToken: '',
                    refreshToken: '',
                })
            );
        });

        it('should handle addUserLoginActivity errors', async () => {
            (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(true);
            tokenFns.generateToken
                .mockReturnValueOnce('access-token')
                .mockReturnValueOnce('refresh-token');
            (addUserLoginActivity as jest.Mock).mockRejectedValue(new Error('Activity log failed'));

            await loginUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Failed to login user',
                    status: status.INTERNAL,
                    data: null,
                    accessToken: '',
                    refreshToken: '',
                })
            );
        });
    });

    describe('edge cases', () => {
        it('should handle missing fields in request', async () => {
            const callWithMissingFields = {
                request: {
                    email: '',
                    password: '',
                    role: '',
                },
            };

            (getUserByEmail as jest.Mock).mockResolvedValue(null);

            await loginUser(callWithMissingFields as any, mockCallback);

            expect(getUserByEmail).toHaveBeenCalledWith('');
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User not registered',
                    status: status.NOT_FOUND,
                })
            );
        });

        it('should handle user with missing name fields', async () => {
            const userWithMissingNames = {
                ...mockUser,
                first_name: '',  // Use empty string instead of null
                last_name: '',   // Use empty string instead of null
            };

            (getUserByEmail as jest.Mock).mockResolvedValue(userWithMissingNames);
            hashFns.compareHash.mockResolvedValue(true);
            tokenFns.generateToken
                .mockReturnValueOnce('access-token')
                .mockReturnValueOnce('refresh-token');
            (addUserLoginActivity as jest.Mock).mockResolvedValue(true);

            await loginUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User logged in successfully',
                    status: status.OK,
                    data: expect.objectContaining({
                        first_name: '',
                        last_name: '',
                        sample_registered: false, // Missing required fields (empty strings are falsy)
                    }),
                })
            );
        });

        it('should exclude password from user data in response', async () => {
            (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(true);
            tokenFns.generateToken
                .mockReturnValueOnce('access-token')
                .mockReturnValueOnce('refresh-token');
            (addUserLoginActivity as jest.Mock).mockResolvedValue(true);

            await loginUser(mockCall as any, mockCallback);

            const callbackCall = mockCallback.mock.calls[0][1];
            expect(callbackCall.data).toBeDefined();
            expect(callbackCall.data).not.toHaveProperty('password');
            
            // Also verify the response structure is correct
            expect(callbackCall).toEqual(
                expect.objectContaining({
                    message: 'User logged in successfully',
                    status: status.OK,
                    data: expect.objectContaining({
                        id: 'user-123',
                        email: 'test@example.com',
                        first_name: 'John',
                        last_name: 'Doe',
                        sample_registered: true,
                    }),
                })
            );
        });
    });
});