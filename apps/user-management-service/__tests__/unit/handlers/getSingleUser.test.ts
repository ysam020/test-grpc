// Mock dependencies
jest.mock('@atc/common', () => ({
    errorMessage: {
        USER: {
            UNAUTHORIZED_ACCESS: 'Unauthorized access',
            NOT_FOUND: 'User not found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        USER: {
            RETRIEVED: 'User retrieved successfully',
        },
    },
    UserRoleEnum: {
        ADMIN: 'ADMIN',
        USER: 'USER',
        MODERATOR: 'MODERATOR',
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
    getUserByID: jest.fn(),
}));

import { getSingleUser } from '../../../src/handlers/getSingleUser';
import { UserRoleEnum, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { status } from '@grpc/grpc-js';
import { getUserByID } from '../../../src/services/model.service';

describe('Get Single User Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
    });

    const mockCompleteUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        profile_pic: 'https://example.com/profile.jpg',
        createdAt: new Date('2023-01-15T10:30:00Z'),
        address: '123 Main St',
        city: 'Test City',
        postcode: '12345',
        no_of_adult: 2,
        no_of_children: 1,
        phone_number: '+1234567890',
        birth_date: new Date('1990-05-15T00:00:00Z'),
        gender: 'Male',
        age: 33,
        Preference: {
            retailers: [
                { id: 'retailer-1', retailer_name: 'Store A' },
                { id: 'retailer-2', retailer_name: 'Store B' },
            ],
        },
    };

    const mockIncompleteUser = {
        id: 'user-456',
        email: 'incomplete@example.com',
        first_name: 'Jane',
        last_name: null,
        profile_pic: null,
        createdAt: null,
        address: '',
        city: null,
        postcode: null,
        no_of_adult: null,
        no_of_children: null,
        phone_number: '',
        birth_date: null,
        gender: '',
        age: null,
        Preference: null,
    };

    describe('admin accessing any user', () => {
        it('should allow admin to retrieve any user successfully', async () => {
            const mockCallAdmin = {
                request: {
                    id: 'user-123',
                },
                user: {
                    userID: 'admin-456',
                    role: UserRoleEnum.ADMIN,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockCompleteUser);

            await getSingleUser(mockCallAdmin as any, mockCallback);

            expect(getUserByID).toHaveBeenCalledWith('user-123');
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User retrieved successfully',
                    status: status.OK,
                    data: expect.objectContaining({
                        id: 'user-123',
                        email: 'test@example.com',
                        sample_registered: true,
                    }),
                })
            );
        });
    });

    describe('user self-access', () => {
        it('should allow user to retrieve their own profile', async () => {
            const mockCallSelfAccess = {
                request: {
                    id: 'user-123',
                },
                user: {
                    userID: 'user-123',
                    role: UserRoleEnum.USER,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockCompleteUser);

            await getSingleUser(mockCallSelfAccess as any, mockCallback);

            expect(getUserByID).toHaveBeenCalledWith('user-123');
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User retrieved successfully',
                    status: status.OK,
                })
            );
        });
    });

    describe('authorization failures', () => {
        it('should prevent regular user from accessing other users', async () => {
            const mockCallUnauthorized = {
                request: {
                    id: 'other-user-456',
                },
                user: {
                    userID: 'user-123',
                    role: UserRoleEnum.USER,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'other-user-456',
            });

            await getSingleUser(mockCallUnauthorized as any, mockCallback);

            expect(getUserByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Unauthorized access',
                    data: null,
                    status: status.UNAUTHENTICATED,
                })
            );
        });
    });

    describe('user not found scenario', () => {
        it('should return NOT_FOUND when user does not exist', async () => {
            const mockCall = {
                request: {
                    id: 'non-existent-user',
                },
                user: {
                    userID: 'admin-123',
                    role: UserRoleEnum.ADMIN,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'non-existent-user',
            });
            (getUserByID as jest.Mock).mockResolvedValue(null);

            await getSingleUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User not found',
                    data: null,
                    status: status.NOT_FOUND,
                })
            );
        });
    });

    describe('sample_registered calculation', () => {
        it('should set sample_registered to true when all required fields are present', async () => {
            const mockCall = {
                request: {
                    id: 'user-123',
                },
                user: {
                    userID: 'admin-123',
                    role: UserRoleEnum.ADMIN,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockCompleteUser);

            await getSingleUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: expect.objectContaining({
                        sample_registered: true,
                    }),
                })
            );
        });

        it('should set sample_registered to false when any required field is missing', async () => {
            const mockCall = {
                request: {
                    id: 'user-456',
                },
                user: {
                    userID: 'admin-123',
                    role: UserRoleEnum.ADMIN,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-456',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockIncompleteUser);

            await getSingleUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: expect.objectContaining({
                        sample_registered: false,
                    }),
                })
            );
        });
    });

    describe('data transformation and defaults', () => {
        it('should handle user with null/undefined optional fields', async () => {
            const mockCall = {
                request: {
                    id: 'user-456',
                },
                user: {
                    userID: 'admin-123',
                    role: UserRoleEnum.ADMIN,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-456',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockIncompleteUser);

            await getSingleUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: expect.objectContaining({
                        first_name: 'Jane',
                        last_name: '',
                        profile_pic: '',
                        preferences: { retailers: [] },
                    }),
                })
            );
        });
    });

    describe('error handling', () => {
        it('should handle getUserByID error', async () => {
            const getUserError = new Error('Database connection failed');
            
            const mockCall = {
                request: {
                    id: 'user-123',
                },
                user: {
                    userID: 'admin-123',
                    role: UserRoleEnum.ADMIN,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
            });
            (getUserByID as jest.Mock).mockRejectedValue(getUserError);

            await getSingleUser(mockCall as any, mockCallback);

            expect(logger.error).toHaveBeenCalledWith(getUserError);
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    data: null,
                    status: status.INTERNAL,
                })
            );
        });
    });

    describe('edge cases', () => {
        it('should handle missing userID in call.user', async () => {
            const mockCallNoUserID = {
                request: {
                    id: 'user-123',
                },
                user: {
                    role: UserRoleEnum.USER,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
            });

            await getSingleUser(mockCallNoUserID as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Unauthorized access',
                    data: null,
                    status: status.UNAUTHENTICATED,
                })
            );
        });
    });
});