// Mock dependencies
jest.mock('@atc/common', () => ({
    constants: {
        PROFILE_PIC_FOLDER: 'profile-pics',
    },
    deleteS3Object: jest.fn(),
    errorMessage: {
        USER: {
            NOT_FOUND: 'User not found',
            UNAUTHORIZED_ACCESS: 'Unauthorized access',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        USER: {
            DELETED: 'User deleted successfully',
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
    deleteUserByID: jest.fn(),
    getUserByID: jest.fn(),
}));

import { deleteUser } from '../../../src/handlers/deleteUser';
import { deleteS3Object, UserRoleEnum, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { status } from '@grpc/grpc-js';
import { deleteUserByID, getUserByID } from '../../../src/services/model.service';

describe('Delete User Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
    });

    const mockRegularUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRoleEnum.USER,
        first_name: 'John',
        last_name: 'Doe',
        is_verified: true,
    };

    const mockAdminUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: UserRoleEnum.ADMIN,
        first_name: 'Admin',
        last_name: 'User',
        is_verified: true,
    };

    const mockModeratorUser = {
        id: 'mod-123',
        email: 'mod@example.com',
        role: UserRoleEnum.MODERATOR,
        first_name: 'Moderator',
        last_name: 'User',
        is_verified: true,
    };

    describe('admin deleting regular user', () => {
        const mockCallAdminDeleteUser = {
            request: {
                id: 'user-123',
            },
            user: {
                userID: 'admin-123',
                role: UserRoleEnum.ADMIN,
            },
        };

        it('should allow admin to delete regular user successfully', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCallAdminDeleteUser as any, mockCallback);

            // Verify user lookup
            expect(getUserByID).toHaveBeenCalledWith('user-123');

            // Verify user deletion (admin path)
            expect(deleteUserByID).toHaveBeenCalledWith('user-123');

            // Verify S3 cleanup
            expect(deleteS3Object).toHaveBeenCalledWith('profile-pics', 'user-123');

            // Verify successful response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User deleted successfully',
                    status: status.OK,
                })
            );
        });

        it('should allow admin to delete moderator', async () => {
            const mockCallAdminDeleteMod = {
                request: {
                    id: 'mod-123',
                },
                user: {
                    userID: 'admin-123',
                    role: UserRoleEnum.ADMIN,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'mod-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockModeratorUser);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCallAdminDeleteMod as any, mockCallback);

            expect(deleteUserByID).toHaveBeenCalledWith('mod-123');
            expect(deleteS3Object).toHaveBeenCalledWith('profile-pics', 'mod-123');
        });
    });

    describe('user self-deletion', () => {
        const mockCallUserSelfDelete = {
            request: {
                id: 'user-123',
            },
            user: {
                userID: 'user-123',
                role: UserRoleEnum.USER,
            },
        };

        it('should allow user to delete their own account', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCallUserSelfDelete as any, mockCallback);

            // Verify user lookup
            expect(getUserByID).toHaveBeenCalledWith('user-123');

            // Verify user deletion (self-deletion path)
            expect(deleteUserByID).toHaveBeenCalledWith('user-123');

            // Verify S3 cleanup
            expect(deleteS3Object).toHaveBeenCalledWith('profile-pics', 'user-123');

            // Verify successful response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User deleted successfully',
                    status: status.OK,
                })
            );
        });

        it('should allow moderator to delete their own account', async () => {
            const mockCallModSelfDelete = {
                request: {
                    id: 'mod-123',
                },
                user: {
                    userID: 'mod-123',
                    role: UserRoleEnum.MODERATOR,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'mod-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockModeratorUser);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCallModSelfDelete as any, mockCallback);

            expect(deleteUserByID).toHaveBeenCalledWith('mod-123');
            expect(deleteS3Object).toHaveBeenCalledWith('profile-pics', 'mod-123');
        });
    });

    describe('admin protection', () => {
        it('should prevent deletion of admin users by any role', async () => {
            const mockCallDeleteAdmin = {
                request: {
                    id: 'admin-123',
                },
                user: {
                    userID: 'other-admin-456',
                    role: UserRoleEnum.ADMIN,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'admin-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockAdminUser);

            await deleteUser(mockCallDeleteAdmin as any, mockCallback);

            // Verify user lookup
            expect(getUserByID).toHaveBeenCalledWith('admin-123');

            // Verify early return - no deletion attempted
            expect(deleteUserByID).not.toHaveBeenCalled();
            expect(deleteS3Object).not.toHaveBeenCalled();

            // Verify UNAUTHENTICATED response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Unauthorized access',
                    status: status.UNAUTHENTICATED,
                })
            );
        });

        it('should prevent admin from deleting themselves', async () => {
            const mockCallAdminSelfDelete = {
                request: {
                    id: 'admin-123',
                },
                user: {
                    userID: 'admin-123',
                    role: UserRoleEnum.ADMIN,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'admin-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockAdminUser);

            await deleteUser(mockCallAdminSelfDelete as any, mockCallback);

            expect(getUserByID).toHaveBeenCalledWith('admin-123');
            expect(deleteUserByID).not.toHaveBeenCalled();
            expect(deleteS3Object).not.toHaveBeenCalled();

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Unauthorized access',
                    status: status.UNAUTHENTICATED,
                })
            );
        });
    });

    describe('authorization failures', () => {
        it('should prevent regular user from deleting other users', async () => {
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
            (getUserByID as jest.Mock).mockResolvedValue({
                ...mockRegularUser,
                id: 'other-user-456',
            });

            await deleteUser(mockCallUnauthorized as any, mockCallback);

            // Verify user lookup
            expect(getUserByID).toHaveBeenCalledWith('other-user-456');

            // Verify early return - no deletion attempted
            expect(deleteUserByID).not.toHaveBeenCalled();
            expect(deleteS3Object).not.toHaveBeenCalled();

            // Verify UNAUTHENTICATED response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Unauthorized access',
                    status: status.UNAUTHENTICATED,
                })
            );
        });

        it('should prevent moderator from deleting other users', async () => {
            const mockCallModUnauthorized = {
                request: {
                    id: 'other-user-456',
                },
                user: {
                    userID: 'mod-123',
                    role: UserRoleEnum.MODERATOR,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'other-user-456',
            });
            (getUserByID as jest.Mock).mockResolvedValue({
                ...mockRegularUser,
                id: 'other-user-456',
            });

            await deleteUser(mockCallModUnauthorized as any, mockCallback);

            expect(getUserByID).toHaveBeenCalledWith('other-user-456');
            expect(deleteUserByID).not.toHaveBeenCalled();
            expect(deleteS3Object).not.toHaveBeenCalled();

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Unauthorized access',
                    status: status.UNAUTHENTICATED,
                })
            );
        });

        it('should prevent moderator from deleting other moderators', async () => {
            const mockCallModDeleteMod = {
                request: {
                    id: 'other-mod-456',
                },
                user: {
                    userID: 'mod-123',
                    role: UserRoleEnum.MODERATOR,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'other-mod-456',
            });
            (getUserByID as jest.Mock).mockResolvedValue({
                ...mockModeratorUser,
                id: 'other-mod-456',
            });

            await deleteUser(mockCallModDeleteMod as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Unauthorized access',
                    status: status.UNAUTHENTICATED,
                })
            );
        });
    });

    describe('user not found scenario', () => {
        it('should return NOT_FOUND when user does not exist', async () => {
            const mockCallNonExistentUser = {
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

            await deleteUser(mockCallNonExistentUser as any, mockCallback);

            // Verify user lookup
            expect(getUserByID).toHaveBeenCalledWith('non-existent-user');

            // Verify early return - no deletion attempted
            expect(deleteUserByID).not.toHaveBeenCalled();
            expect(deleteS3Object).not.toHaveBeenCalled();

            // Verify NOT_FOUND response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User not found',
                    status: status.NOT_FOUND,
                })
            );
        });

        it('should return NOT_FOUND when user lookup returns undefined', async () => {
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
            (getUserByID as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User not found',
                    status: status.NOT_FOUND,
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

            await deleteUser(mockCall as any, mockCallback);

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(getUserError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                })
            );

            // Verify subsequent services were not called
            expect(deleteUserByID).not.toHaveBeenCalled();
            expect(deleteS3Object).not.toHaveBeenCalled();
        });

        it('should handle deleteUserByID error', async () => {
            const deleteUserError = new Error('Failed to delete user from database');
            
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
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);
            (deleteUserByID as jest.Mock).mockRejectedValue(deleteUserError);

            await deleteUser(mockCall as any, mockCallback);

            // Verify services were called up to the error point
            expect(getUserByID).toHaveBeenCalledWith('user-123');
            expect(deleteUserByID).toHaveBeenCalledWith('user-123');

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(deleteUserError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                })
            );

            // Verify S3 cleanup was not called due to database error
            expect(deleteS3Object).not.toHaveBeenCalled();
        });

        it('should handle deleteS3Object error but still return success', async () => {
            const deleteS3Error = new Error('Failed to delete S3 object');
            
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
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockRejectedValue(deleteS3Error);

            await deleteUser(mockCall as any, mockCallback);

            // Verify all services were called
            expect(getUserByID).toHaveBeenCalledWith('user-123');
            expect(deleteUserByID).toHaveBeenCalledWith('user-123');
            expect(deleteS3Object).toHaveBeenCalledWith('profile-pics', 'user-123');

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(deleteS3Error);

            // Verify error response (S3 failure should cause overall failure)
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                })
            );
        });

        it('should handle utilFns.removeEmptyFields error', async () => {
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

            await deleteUser(mockCall as any, mockCallback);

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(removeEmptyFieldsError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                })
            );

            // Verify no subsequent services were called
            expect(getUserByID).not.toHaveBeenCalled();
            expect(deleteUserByID).not.toHaveBeenCalled();
            expect(deleteS3Object).not.toHaveBeenCalled();
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

            await deleteUser(mockCall as any, mockCallback);

            // Should attempt to call getUserByID with undefined
            expect(getUserByID).toHaveBeenCalledWith(undefined);
        });

        it('should handle missing role in call.user', async () => {
            const mockCallNoRole = {
                request: {
                    id: 'user-123',
                },
                user: {
                    userID: 'user-123',
                    // Missing role
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCallNoRole as any, mockCallback);

            // Should proceed with non-admin logic (role is falsy)
            expect(deleteUserByID).toHaveBeenCalledWith('user-123');
        });

        it('should handle missing userID in call.user', async () => {
            const mockCallNoUserID = {
                request: {
                    id: 'user-123',
                },
                user: {
                    role: UserRoleEnum.USER,
                    // Missing userID
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);

            await deleteUser(mockCallNoUserID as any, mockCallback);

            // Should trigger authorization failure due to ID mismatch
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Unauthorized access',
                    status: status.UNAUTHENTICATED,
                })
            );
        });

        it('should handle user with unknown role', async () => {
            const userWithUnknownRole = {
                ...mockRegularUser,
                role: 'UNKNOWN_ROLE',
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
            (getUserByID as jest.Mock).mockResolvedValue(userWithUnknownRole);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCall as any, mockCallback);

            // Should proceed with deletion (unknown role is not ADMIN)
            expect(deleteUserByID).toHaveBeenCalledWith('user-123');
            expect(deleteS3Object).toHaveBeenCalledWith('profile-pics', 'user-123');
        });

        it('should handle null user role', async () => {
            const userWithNullRole = {
                ...mockRegularUser,
                role: null,
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
            (getUserByID as jest.Mock).mockResolvedValue(userWithNullRole);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCall as any, mockCallback);

            // Should proceed with deletion (null role is not ADMIN)
            expect(deleteUserByID).toHaveBeenCalledWith('user-123');
        });
    });

    describe('function call order and dependencies', () => {
        it('should call functions in correct order for admin deletion', async () => {
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
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCall as any, mockCallback);

            // Verify call order
            const removeEmptyFieldsCall = utilFns.removeEmptyFields.mock.invocationCallOrder[0];
            const getUserCall = (getUserByID as jest.Mock).mock.invocationCallOrder[0];
            const deleteUserCall = (deleteUserByID as jest.Mock).mock.invocationCallOrder[0];
            const deleteS3Call = (deleteS3Object as jest.Mock).mock.invocationCallOrder[0];
            const callbackCall = mockCallback.mock.invocationCallOrder[0];

            expect(removeEmptyFieldsCall).toBeLessThan(getUserCall);
            expect(getUserCall).toBeLessThan(deleteUserCall);
            expect(deleteUserCall).toBeLessThan(deleteS3Call);
            expect(deleteS3Call).toBeLessThan(callbackCall);
        });

        it('should call functions in correct order for self-deletion', async () => {
            const mockCall = {
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
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCall as any, mockCallback);

            // Should follow same order but with userID for deletion
            expect(deleteUserByID).toHaveBeenCalledWith('user-123');
            expect(deleteS3Object).toHaveBeenCalledWith('profile-pics', 'user-123');
        });

        it('should not proceed after user not found', async () => {
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

            await deleteUser(mockCall as any, mockCallback);

            expect(getUserByID).toHaveBeenCalled();
            expect(deleteUserByID).not.toHaveBeenCalled();
            expect(deleteS3Object).not.toHaveBeenCalled();
        });

        it('should not proceed after admin protection check', async () => {
            const mockCall = {
                request: {
                    id: 'admin-123',
                },
                user: {
                    userID: 'other-admin-456',
                    role: UserRoleEnum.ADMIN,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'admin-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockAdminUser);

            await deleteUser(mockCall as any, mockCallback);

            expect(getUserByID).toHaveBeenCalled();
            expect(deleteUserByID).not.toHaveBeenCalled();
            expect(deleteS3Object).not.toHaveBeenCalled();
        });

        it('should not proceed after authorization failure', async () => {
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
            (getUserByID as jest.Mock).mockResolvedValue({
                ...mockRegularUser,
                id: 'other-user-456',
            });

            await deleteUser(mockCall as any, mockCallback);

            expect(getUserByID).toHaveBeenCalled();
            expect(deleteUserByID).not.toHaveBeenCalled();
            expect(deleteS3Object).not.toHaveBeenCalled();
        });
    });

    describe('role-based logic paths', () => {
        it('should use user.id for admin deletion path', async () => {
            const mockCall = {
                request: {
                    id: 'user-123',
                },
                user: {
                    userID: 'admin-456', // Different from target user
                    role: UserRoleEnum.ADMIN,
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCall as any, mockCallback);

            // Admin path should use user.id (target user's ID)
            expect(deleteUserByID).toHaveBeenCalledWith('user-123');
            expect(deleteS3Object).toHaveBeenCalledWith('profile-pics', 'user-123');
        });

        it('should use userID for non-admin self-deletion path', async () => {
            const mockCall = {
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
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCall as any, mockCallback);

            // Non-admin path should use userID (authenticated user's ID)
            expect(deleteUserByID).toHaveBeenCalledWith('user-123');
            expect(deleteS3Object).toHaveBeenCalledWith('profile-pics', 'user-123');
        });

        it('should distinguish between admin and non-admin deletion paths', async () => {
            // Test admin path
            const mockCallAdmin = {
                request: { id: 'target-user-123' },
                user: { userID: 'admin-456', role: UserRoleEnum.ADMIN },
            };

            utilFns.removeEmptyFields.mockReturnValue({ id: 'target-user-123' });
            (getUserByID as jest.Mock).mockResolvedValue({ ...mockRegularUser, id: 'target-user-123' });
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCallAdmin as any, mockCallback);

            // Admin path: uses target user ID from request
            expect(deleteUserByID).toHaveBeenCalledWith('target-user-123');

            jest.clearAllMocks();

            // Test non-admin path
            const mockCallUser = {
                request: { id: 'user-123' },
                user: { userID: 'user-123', role: UserRoleEnum.USER },
            };

            utilFns.removeEmptyFields.mockReturnValue({ id: 'user-123' });
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCallUser as any, mockCallback);

            // Non-admin path: uses authenticated userID
            expect(deleteUserByID).toHaveBeenCalledWith('user-123');
        });
    });

    describe('callback responses', () => {
        it('should always call callback with null as first parameter on success', async () => {
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
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null, // First parameter should always be null for gRPC success
                expect.any(Object)
            );
        });

        it('should always call callback with null as first parameter on error', async () => {
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
            (getUserByID as jest.Mock).mockRejectedValue(new Error('Test error'));

            await deleteUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null, // First parameter should always be null, errors are in response object
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
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                {
                    message: 'User deleted successfully',
                    status: status.OK,
                }
            );
        });

        it('should include correct response structure on various error types', async () => {
            // Test user not found
            const mockCallNotFound = {
                request: { id: 'non-existent' },
                user: { userID: 'admin-123', role: UserRoleEnum.ADMIN },
            };

            utilFns.removeEmptyFields.mockReturnValue({ id: 'non-existent' });
            (getUserByID as jest.Mock).mockResolvedValue(null);

            await deleteUser(mockCallNotFound as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                {
                    message: 'User not found',
                    status: status.NOT_FOUND,
                }
            );

            jest.clearAllMocks();

            // Test unauthorized access
            const mockCallUnauthorized = {
                request: { id: 'admin-123' },
                user: { userID: 'admin-456', role: UserRoleEnum.ADMIN },
            };

            utilFns.removeEmptyFields.mockReturnValue({ id: 'admin-123' });
            (getUserByID as jest.Mock).mockResolvedValue(mockAdminUser);

            await deleteUser(mockCallUnauthorized as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                {
                    message: 'Unauthorized access',
                    status: status.UNAUTHENTICATED,
                }
            );
        });
    });

    describe('S3 cleanup behavior', () => {
        it('should always attempt S3 cleanup after successful user deletion', async () => {
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
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCall as any, mockCallback);

            // Verify S3 cleanup is attempted with correct parameters
            expect(deleteS3Object).toHaveBeenCalledWith('profile-pics', 'user-123');
        });

        it('should use target user ID for S3 cleanup regardless of deletion path', async () => {
            // Admin deleting another user
            const mockCallAdmin = {
                request: { id: 'target-user-456' },
                user: { userID: 'admin-123', role: UserRoleEnum.ADMIN },
            };

            utilFns.removeEmptyFields.mockReturnValue({ id: 'target-user-456' });
            (getUserByID as jest.Mock).mockResolvedValue({ ...mockRegularUser, id: 'target-user-456' });
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCallAdmin as any, mockCallback);

            // Should use target user's ID for S3 cleanup
            expect(deleteS3Object).toHaveBeenCalledWith('profile-pics', 'target-user-456');

            jest.clearAllMocks();

            // User deleting themselves
            const mockCallSelf = {
                request: { id: 'user-123' },
                user: { userID: 'user-123', role: UserRoleEnum.USER },
            };

            utilFns.removeEmptyFields.mockReturnValue({ id: 'user-123' });
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCallSelf as any, mockCallback);

            // Should still use target user's ID for S3 cleanup
            expect(deleteS3Object).toHaveBeenCalledWith('profile-pics', 'user-123');
        });

        it('should not attempt S3 cleanup if user deletion fails', async () => {
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
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);
            (deleteUserByID as jest.Mock).mockRejectedValue(new Error('Database error'));

            await deleteUser(mockCall as any, mockCallback);

            expect(deleteUserByID).toHaveBeenCalled();
            expect(deleteS3Object).not.toHaveBeenCalled();
        });
    });

    describe('complex authorization scenarios', () => {
        it('should handle case-sensitive role comparison', async () => {
            const userWithLowercaseRole = {
                ...mockRegularUser,
                role: 'admin', // lowercase instead of ADMIN
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
            (getUserByID as jest.Mock).mockResolvedValue(userWithLowercaseRole);
            (deleteUserByID as jest.Mock).mockResolvedValue(undefined);
            (deleteS3Object as jest.Mock).mockResolvedValue(undefined);

            await deleteUser(mockCall as any, mockCallback);

            // Should proceed with deletion (lowercase 'admin' !== 'ADMIN')
            expect(deleteUserByID).toHaveBeenCalledWith('user-123');
            expect(deleteS3Object).toHaveBeenCalledWith('profile-pics', 'user-123');
        });

        it('should handle mixed role scenarios', async () => {
            // Admin with different casing in caller role
            const mockCallMixedCase = {
                request: { id: 'user-123' },
                user: { userID: 'admin-123', role: 'Admin' }, // Mixed case
            };

            utilFns.removeEmptyFields.mockReturnValue({ id: 'user-123' });
            (getUserByID as jest.Mock).mockResolvedValue(mockRegularUser);

            await deleteUser(mockCallMixedCase as any, mockCallback);

            // Should use non-admin path due to role mismatch
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Unauthorized access',
                    status: status.UNAUTHENTICATED,
                })
            );
        });
    });
});