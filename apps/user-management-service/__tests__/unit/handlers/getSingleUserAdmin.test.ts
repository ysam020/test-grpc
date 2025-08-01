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

import { getSingleUserAdmin } from '../../../src/handlers/getSingleUserAdmin';
import { UserRoleEnum, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { status } from '@grpc/grpc-js';
import { getUserByID } from '../../../src/services/model.service';

describe('Get Single User Admin Handler', () => {
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
        postcode: '12345',
        no_of_adult: 2,
        no_of_children: 3,
        gender: 'Male',
        age: 33,
        address: '123 Main St',
        city: 'Test City',
        phone_number: '+1234567890',
    };

    const mockIncompleteUser = {
        id: 'user-456',
        email: 'incomplete@example.com',
        first_name: 'Jane',
        last_name: null,
        postcode: null,
        no_of_adult: null,
        no_of_children: null,
        gender: '',
        age: null,
        address: null,
        city: null,
        phone_number: null,
    };

    describe('successful admin access', () => {
        it('should allow admin to retrieve any user with limited data', async () => {
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

            await getSingleUserAdmin(mockCallAdmin as any, mockCallback);

            expect(getUserByID).toHaveBeenCalledWith('user-123');
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User retrieved successfully',
                    status: status.OK,
                    data: {
                        id: 'user-123',
                        email: '******',
                        postcode: '12345',
                        no_of_adult: 2,
                        no_of_child: 3,
                        gender: 'Male',
                        age: 33,
                    },
                })
            );
        });

        it('should always mask email address', async () => {
            const mockCall = {
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
            (getUserByID as jest.Mock).mockResolvedValue({
                ...mockCompleteUser,
                email: 'sensitive@example.com',
            });

            await getSingleUserAdmin(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: expect.objectContaining({
                        email: '******',
                    }),
                })
            );
        });
    });

    describe('user self-access', () => {
        it('should allow user to retrieve their own limited profile', async () => {
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

            await getSingleUserAdmin(mockCallSelfAccess as any, mockCallback);

            expect(getUserByID).toHaveBeenCalledWith('user-123');
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User retrieved successfully',
                    status: status.OK,
                    data: {
                        id: 'user-123',
                        email: '******',
                        postcode: '12345',
                        no_of_adult: 2,
                        no_of_child: 3,
                        gender: 'Male',
                        age: 33,
                    },
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

            await getSingleUserAdmin(mockCallUnauthorized as any, mockCallback);

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

        it('should handle missing role as non-admin', async () => {
            const mockCallNoRole = {
                request: {
                    id: 'other-user-456',
                },
                user: {
                    userID: 'user-123',
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'other-user-456',
            });

            await getSingleUserAdmin(mockCallNoRole as any, mockCallback);

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

    describe('user not found', () => {
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

            await getSingleUserAdmin(mockCall as any, mockCallback);

            expect(getUserByID).toHaveBeenCalledWith('non-existent-user');
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

    describe('data transformation', () => {
        it('should handle null fields with proper defaults', async () => {
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

            await getSingleUserAdmin(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: {
                        id: 'user-456',
                        email: '******',
                        postcode: 0,
                        no_of_adult: 0,
                        no_of_child: 0,
                        gender: '',
                        age: 0,
                    },
                })
            );
        });

        it('should correctly map no_of_children to no_of_child', async () => {
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
            (getUserByID as jest.Mock).mockResolvedValue({
                ...mockCompleteUser,
                no_of_children: 5,
            });

            await getSingleUserAdmin(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: expect.objectContaining({
                        no_of_child: 5,
                    }),
                })
            );
        });
    });

    describe('privacy validation', () => {
        it('should only expose limited fields and hide sensitive data', async () => {
            const userWithSensitiveData = {
                id: 'user-123',
                email: 'test@example.com',
                password: 'secret-password',
                first_name: 'John',
                last_name: 'Doe',
                address: '123 Secret Address',
                city: 'Private City',
                phone_number: '+1234567890',
                birth_date: new Date('1990-01-01'),
                profile_pic: 'https://example.com/profile.jpg',
                postcode: '12345',
                no_of_adult: 2,
                no_of_children: 1,
                gender: 'Male',
                age: 33,
            };

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
            (getUserByID as jest.Mock).mockResolvedValue(userWithSensitiveData);

            await getSingleUserAdmin(mockCall as any, mockCallback);

            const responseData = mockCallback.mock.calls[0][1].data;

            expect(Object.keys(responseData)).toHaveLength(7);
            expect(responseData).toEqual({
                id: 'user-123',
                email: '******',
                postcode: '12345',
                no_of_adult: 2,
                no_of_child: 1,
                gender: 'Male',
                age: 33,
            });

            expect(responseData).not.toHaveProperty('password');
            expect(responseData).not.toHaveProperty('first_name');
            expect(responseData).not.toHaveProperty('last_name');
            expect(responseData).not.toHaveProperty('address');
            expect(responseData).not.toHaveProperty('phone_number');
        });

        it('should mask email for all types of users', async () => {
            const emailTestCases = [
                'admin@company.com',
                'user@personal.com',
                'sensitive@example.org',
                '',
                null,
            ];

            const mockCall = {
                request: {
                    id: 'user-123',
                },
                user: {
                    userID: 'admin-123',
                    role: UserRoleEnum.ADMIN,
                },
            };

            for (const email of emailTestCases) {
                jest.clearAllMocks();
                utilFns.removeEmptyFields.mockReturnValue({
                    id: 'user-123',
                });
                (getUserByID as jest.Mock).mockResolvedValue({
                    ...mockCompleteUser,
                    email: email,
                });

                await getSingleUserAdmin(mockCall as any, mockCallback);

                expect(mockCallback).toHaveBeenCalledWith(
                    null,
                    expect.objectContaining({
                        data: expect.objectContaining({
                            email: '******',
                        }),
                    })
                );
            }
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

            await getSingleUserAdmin(mockCall as any, mockCallback);

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

        it('should handle field validation error', async () => {
            const removeEmptyFieldsError = new Error('Field validation failed');
            
            const mockCall = {
                request: {
                    id: 'user-123',
                },
                user: {
                    userID: 'admin-123',
                    role: UserRoleEnum.ADMIN,
                },
            };

            utilFns.removeEmptyFields.mockImplementation(() => {
                throw removeEmptyFieldsError;
            });

            await getSingleUserAdmin(mockCall as any, mockCallback);

            expect(logger.error).toHaveBeenCalledWith(removeEmptyFieldsError);
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    data: null,
                    status: status.INTERNAL,
                })
            );
            expect(getUserByID).not.toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('should handle missing id in request', async () => {
            const mockCall = {
                request: {},
                user: {
                    userID: 'admin-123',
                    role: UserRoleEnum.ADMIN,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({});

            await getSingleUserAdmin(mockCall as any, mockCallback);

            expect(getUserByID).toHaveBeenCalledWith(undefined);
        });

        it('should handle missing userID', async () => {
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

            await getSingleUserAdmin(mockCallNoUserID as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Unauthorized access',
                    data: null,
                    status: status.UNAUTHENTICATED,
                })
            );
        });

        it('should handle user with all null data', async () => {
            const userAllNull = {
                id: 'user-null',
                email: null,
                postcode: null,
                no_of_adult: null,
                no_of_children: null,
                gender: null,
                age: null,
            };

            const mockCall = {
                request: {
                    id: 'user-null',
                },
                user: {
                    userID: 'admin-123',
                    role: UserRoleEnum.ADMIN,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-null',
            });
            (getUserByID as jest.Mock).mockResolvedValue(userAllNull);

            await getSingleUserAdmin(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: {
                        id: 'user-null',
                        email: '******',
                        postcode: 0,
                        no_of_adult: 0,
                        no_of_child: 0,
                        gender: '',
                        age: 0,
                    },
                })
            );
        });

        it('should handle undefined values with proper defaults', async () => {
            const userWithUndefined = {
                id: 'user-123',
                email: 'test@example.com',
                postcode: undefined,
                no_of_adult: undefined,
                no_of_children: undefined,
                gender: undefined,
                age: undefined,
            };

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
            (getUserByID as jest.Mock).mockResolvedValue(userWithUndefined);

            await getSingleUserAdmin(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: {
                        id: 'user-123',
                        email: '******',
                        postcode: 0,
                        no_of_adult: 0,
                        no_of_child: 0,
                        gender: '',
                        age: 0,
                    },
                })
            );
        });
    });

    describe('function execution flow', () => {
        it('should call functions in correct order', async () => {
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

            await getSingleUserAdmin(mockCall as any, mockCallback);

            const removeEmptyFieldsCall = utilFns.removeEmptyFields.mock.invocationCallOrder[0];
            const getUserCall = (getUserByID as jest.Mock).mock.invocationCallOrder[0];
            const callbackCall = mockCallback.mock.invocationCallOrder[0];

            expect(removeEmptyFieldsCall).toBeLessThan(getUserCall);
            expect(getUserCall).toBeLessThan(callbackCall);
        });

        it('should not call getUserByID if authorization fails early', async () => {
            const mockCall = {
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

            await getSingleUserAdmin(mockCall as any, mockCallback);

            expect(getUserByID).not.toHaveBeenCalled();
        });
    });

    describe('callback response validation', () => {
        it('should always call callback with null as first parameter', async () => {
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

            await getSingleUserAdmin(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.any(Object)
            );
        });

        it('should include correct response structure on success', async () => {
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

            await getSingleUserAdmin(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                {
                    message: 'User retrieved successfully',
                    status: status.OK,
                    data: {
                        id: expect.any(String),
                        email: '******',
                        postcode: expect.anything(),
                        no_of_adult: expect.anything(),
                        no_of_child: expect.anything(),
                        gender: expect.any(String),
                        age: expect.anything(),
                    },
                }
            );
        });
    });
});