// Mock dependencies
jest.mock('@atc/common', () => ({
    errorMessage: {
        USER: {
            UNAUTHORIZED_ACCESS: 'Unauthorized access',
            NOT_FOUND: 'User not found',
        },
        PASSWORD: {
            INCORRECT_CURRENT_PASSWORD: 'Current password is incorrect',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        PASSWORD: {
            UPDATED: 'Password updated successfully',
        },
    },
    hashFns: {
        compareHash: jest.fn(),
        hashValue: jest.fn(),
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
    updateUserByID: jest.fn(),
}));

import { changePassword } from '../../../src/handlers/changePassword';
import { hashFns, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { status } from '@grpc/grpc-js';
import { getUserByID, updateUserByID } from '../../../src/services/model.service';

describe('Change Password Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
    });

    const mockCall = {
        request: {
            id: 'user-123',
            current_password: 'current-password',
            new_password: 'new-password-123',
        },
        user: {
            userID: 'user-123',
        },
    };

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-current-password',
        first_name: 'John',
        last_name: 'Doe',
        is_verified: true,
    };

    describe('successful password change', () => {
        it('should change password successfully when all validations pass', async () => {
            // Mock successful dependencies
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(true);
            hashFns.hashValue.mockResolvedValue('hashed-new-password');
            (updateUserByID as jest.Mock).mockResolvedValue(undefined);

            await changePassword(mockCall as any, mockCallback);

            // Verify utilFns.removeEmptyFields was called
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);

            // Verify user lookup
            expect(getUserByID).toHaveBeenCalledWith('user-123');

            // Verify password comparison
            expect(hashFns.compareHash).toHaveBeenCalledWith(
                'current-password',
                'hashed-current-password'
            );

            // Verify new password hashing
            expect(hashFns.hashValue).toHaveBeenCalledWith('new-password-123');

            // Verify user password update
            expect(updateUserByID).toHaveBeenCalledWith('user-123', {
                password: 'hashed-new-password',
            });

            // Verify successful response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Password updated successfully',
                    status: status.OK,
                })
            );
        });

        it('should handle different user IDs correctly', async () => {
            const mockCallDifferentUser = {
                request: {
                    id: 'user-456',
                    current_password: 'current-password',
                    new_password: 'new-password-123',
                },
                user: {
                    userID: 'user-456',
                },
            };

            const mockUserDifferent = {
                ...mockUser,
                id: 'user-456',
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-456',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUserDifferent);
            hashFns.compareHash.mockResolvedValue(true);
            hashFns.hashValue.mockResolvedValue('hashed-new-password');
            (updateUserByID as jest.Mock).mockResolvedValue(undefined);

            await changePassword(mockCallDifferentUser as any, mockCallback);

            expect(getUserByID).toHaveBeenCalledWith('user-456');
            expect(updateUserByID).toHaveBeenCalledWith('user-456', {
                password: 'hashed-new-password',
            });
        });
    });

    describe('authorization validation', () => {
        it('should return UNAUTHENTICATED when userID does not match request id', async () => {
            const mockCallMismatchedUser = {
                request: {
                    id: 'user-456', // Different from userID
                    current_password: 'current-password',
                    new_password: 'new-password-123',
                },
                user: {
                    userID: 'user-123', // Different from request id
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-456',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });

            await changePassword(mockCallMismatchedUser as any, mockCallback);

            // Verify early return - no further service calls
            expect(getUserByID).not.toHaveBeenCalled();
            expect(hashFns.compareHash).not.toHaveBeenCalled();
            expect(hashFns.hashValue).not.toHaveBeenCalled();
            expect(updateUserByID).not.toHaveBeenCalled();

            // Verify UNAUTHENTICATED response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Unauthorized access',
                    status: status.UNAUTHENTICATED,
                })
            );
        });

        it('should handle string vs number ID comparison', async () => {
            const mockCallNumberId = {
                request: {
                    id: 123, // Number instead of string
                    current_password: 'current-password',
                    new_password: 'new-password-123',
                },
                user: {
                    userID: 'user-123', // String
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 123,
                current_password: 'current-password',
                new_password: 'new-password-123',
            });

            await changePassword(mockCallNumberId as any, mockCallback);

            // Should trigger authorization failure due to type mismatch
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
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(null);

            await changePassword(mockCall as any, mockCallback);

            // Verify user lookup
            expect(getUserByID).toHaveBeenCalledWith('user-123');

            // Verify early return - no further service calls
            expect(hashFns.compareHash).not.toHaveBeenCalled();
            expect(hashFns.hashValue).not.toHaveBeenCalled();
            expect(updateUserByID).not.toHaveBeenCalled();

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
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(undefined);

            await changePassword(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'User not found',
                    status: status.NOT_FOUND,
                })
            );
        });
    });

    describe('password validation', () => {
        it('should return UNAUTHENTICATED when current password is incorrect', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'wrong-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(false); // Password doesn't match

            await changePassword(mockCall as any, mockCallback);

            // Verify services were called up to password check
            expect(getUserByID).toHaveBeenCalledWith('user-123');
            expect(hashFns.compareHash).toHaveBeenCalledWith(
                'wrong-password',
                'hashed-current-password'
            );

            // Verify early return - no further service calls
            expect(hashFns.hashValue).not.toHaveBeenCalled();
            expect(updateUserByID).not.toHaveBeenCalled();

            // Verify UNAUTHENTICATED response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Current password is incorrect',
                    status: status.UNAUTHENTICATED,
                })
            );
        });

        it('should handle empty current password', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: '',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(false);

            await changePassword(mockCall as any, mockCallback);

            expect(hashFns.compareHash).toHaveBeenCalledWith('', 'hashed-current-password');
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Current password is incorrect',
                    status: status.UNAUTHENTICATED,
                })
            );
        });
    });

    describe('error handling', () => {
        it('should handle getUserByID error', async () => {
            const getUserError = new Error('Database connection failed');
            
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockRejectedValue(getUserError);

            await changePassword(mockCall as any, mockCallback);

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
            expect(hashFns.compareHash).not.toHaveBeenCalled();
            expect(hashFns.hashValue).not.toHaveBeenCalled();
            expect(updateUserByID).not.toHaveBeenCalled();
        });

        it('should handle compareHash error', async () => {
            const compareHashError = new Error('Hash comparison failed');
            
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockRejectedValue(compareHashError);

            await changePassword(mockCall as any, mockCallback);

            // Verify services were called up to the error point
            expect(getUserByID).toHaveBeenCalledWith('user-123');
            expect(hashFns.compareHash).toHaveBeenCalledWith(
                'current-password',
                'hashed-current-password'
            );

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(compareHashError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                })
            );

            // Verify subsequent services were not called
            expect(hashFns.hashValue).not.toHaveBeenCalled();
            expect(updateUserByID).not.toHaveBeenCalled();
        });

        it('should handle hashValue error', async () => {
            const hashValueError = new Error('Password hashing failed');
            
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(true);
            hashFns.hashValue.mockRejectedValue(hashValueError);

            await changePassword(mockCall as any, mockCallback);

            // Verify services were called up to the error point
            expect(getUserByID).toHaveBeenCalledWith('user-123');
            expect(hashFns.compareHash).toHaveBeenCalledWith(
                'current-password',
                'hashed-current-password'
            );
            expect(hashFns.hashValue).toHaveBeenCalledWith('new-password-123');

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(hashValueError);

            // Verify error response
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    status: status.INTERNAL,
                })
            );

            // Verify updateUserByID was not called
            expect(updateUserByID).not.toHaveBeenCalled();
        });

        it('should handle updateUserByID error', async () => {
            const updateUserError = new Error('Database update failed');
            
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(true);
            hashFns.hashValue.mockResolvedValue('hashed-new-password');
            (updateUserByID as jest.Mock).mockRejectedValue(updateUserError);

            await changePassword(mockCall as any, mockCallback);

            // Verify all services were called up to the error point
            expect(getUserByID).toHaveBeenCalledWith('user-123');
            expect(hashFns.compareHash).toHaveBeenCalledWith(
                'current-password',
                'hashed-current-password'
            );
            expect(hashFns.hashValue).toHaveBeenCalledWith('new-password-123');
            expect(updateUserByID).toHaveBeenCalledWith('user-123', {
                password: 'hashed-new-password',
            });

            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(updateUserError);

            // Verify error response
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
            
            utilFns.removeEmptyFields.mockImplementation(() => {
                throw removeEmptyFieldsError;
            });

            await changePassword(mockCall as any, mockCallback);

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
            expect(hashFns.compareHash).not.toHaveBeenCalled();
            expect(hashFns.hashValue).not.toHaveBeenCalled();
            expect(updateUserByID).not.toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('should handle missing fields after removeEmptyFields', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                // Missing id, current_password, new_password
            });

            await changePassword(mockCall as any, mockCallback);

            // Should trigger authorization failure due to undefined id
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Unauthorized access',
                    status: status.UNAUTHENTICATED,
                })
            );
        });

        it('should handle missing userID in call.user', async () => {
            const mockCallWithoutUserID = {
                request: {
                    id: 'user-123',
                    current_password: 'current-password',
                    new_password: 'new-password-123',
                },
                user: {}, // Missing userID
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });

            await changePassword(mockCallWithoutUserID as any, mockCallback);

            // Should trigger authorization failure due to undefined userID
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Unauthorized access',
                    status: status.UNAUTHENTICATED,
                })
            );
        });

        it('should handle user with missing password field', async () => {
            const userWithoutPassword = {
                ...mockUser,
                password: undefined,
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(userWithoutPassword);
            hashFns.compareHash.mockResolvedValue(false);

            await changePassword(mockCall as any, mockCallback);

            expect(hashFns.compareHash).toHaveBeenCalledWith(
                'current-password',
                undefined
            );
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Current password is incorrect',
                    status: status.UNAUTHENTICATED,
                })
            );
        });

        it('should handle same current and new password', async () => {
            const mockCallSamePasswords = {
                request: {
                    id: 'user-123',
                    current_password: 'same-password',
                    new_password: 'same-password',
                },
                user: {
                    userID: 'user-123',
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'same-password',
                new_password: 'same-password',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(true);
            hashFns.hashValue.mockResolvedValue('hashed-same-password');
            (updateUserByID as jest.Mock).mockResolvedValue(undefined);

            await changePassword(mockCallSamePasswords as any, mockCallback);

            // Should still proceed with password change
            expect(hashFns.hashValue).toHaveBeenCalledWith('same-password');
            expect(updateUserByID).toHaveBeenCalledWith('user-123', {
                password: 'hashed-same-password',
            });

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Password updated successfully',
                    status: status.OK,
                })
            );
        });
    });

    describe('function call order and dependencies', () => {
        it('should call functions in correct order', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(true);
            hashFns.hashValue.mockResolvedValue('hashed-new-password');
            (updateUserByID as jest.Mock).mockResolvedValue(undefined);

            await changePassword(mockCall as any, mockCallback);

            // Verify call order
            const removeEmptyFieldsCall = utilFns.removeEmptyFields.mock.invocationCallOrder[0];
            const getUserCall = (getUserByID as jest.Mock).mock.invocationCallOrder[0];
            const compareHashCall = hashFns.compareHash.mock.invocationCallOrder[0];
            const hashValueCall = hashFns.hashValue.mock.invocationCallOrder[0];
            const updateUserCall = (updateUserByID as jest.Mock).mock.invocationCallOrder[0];
            const callbackCall = mockCallback.mock.invocationCallOrder[0];

            expect(removeEmptyFieldsCall).toBeLessThan(getUserCall);
            expect(getUserCall).toBeLessThan(compareHashCall);
            expect(compareHashCall).toBeLessThan(hashValueCall);
            expect(hashValueCall).toBeLessThan(updateUserCall);
            expect(updateUserCall).toBeLessThan(callbackCall);
        });

        it('should not proceed after authorization failure', async () => {
            const mockCallUnauthorized = {
                request: {
                    id: 'user-456',
                    current_password: 'current-password',
                    new_password: 'new-password-123',
                },
                user: {
                    userID: 'user-123',
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-456',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });

            await changePassword(mockCallUnauthorized as any, mockCallback);

            expect(getUserByID).not.toHaveBeenCalled();
            expect(hashFns.compareHash).not.toHaveBeenCalled();
            expect(hashFns.hashValue).not.toHaveBeenCalled();
            expect(updateUserByID).not.toHaveBeenCalled();
        });

        it('should not proceed after user not found', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(null);

            await changePassword(mockCall as any, mockCallback);

            expect(getUserByID).toHaveBeenCalled();
            expect(hashFns.compareHash).not.toHaveBeenCalled();
            expect(hashFns.hashValue).not.toHaveBeenCalled();
            expect(updateUserByID).not.toHaveBeenCalled();
        });

        it('should not proceed after password verification failure', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'wrong-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(false);

            await changePassword(mockCall as any, mockCallback);

            expect(getUserByID).toHaveBeenCalled();
            expect(hashFns.compareHash).toHaveBeenCalled();
            expect(hashFns.hashValue).not.toHaveBeenCalled();
            expect(updateUserByID).not.toHaveBeenCalled();
        });
    });

    describe('callback responses', () => {
        it('should always call callback with null as first parameter on success', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(true);
            hashFns.hashValue.mockResolvedValue('hashed-new-password');
            (updateUserByID as jest.Mock).mockResolvedValue(undefined);

            await changePassword(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null, // First parameter should always be null for gRPC success
                expect.any(Object)
            );
        });

        it('should always call callback with null as first parameter on error', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockRejectedValue(new Error('Test error'));

            await changePassword(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null, // First parameter should always be null, errors are in response object
                expect.any(Object)
            );
        });

        it('should include correct response structure on success', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(true);
            hashFns.hashValue.mockResolvedValue('hashed-new-password');
            (updateUserByID as jest.Mock).mockResolvedValue(undefined);

            await changePassword(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                {
                    message: 'Password updated successfully',
                    status: status.OK,
                }
            );
        });

        it('should include correct response structure on various error types', async () => {
            // Test unauthorized access
            const mockCallUnauthorized = {
                request: {
                    id: 'user-456',
                    current_password: 'current-password',
                    new_password: 'new-password-123',
                },
                user: {
                    userID: 'user-123',
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-456',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });

            await changePassword(mockCallUnauthorized as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                {
                    message: 'Unauthorized access',
                    status: status.UNAUTHENTICATED,
                }
            );
        });
    });

    describe('security validations', () => {
        it('should prevent user from changing another users password', async () => {
            const mockCallDifferentUser = {
                request: {
                    id: 'user-456', // Trying to change different user's password
                    current_password: 'current-password',
                    new_password: 'new-password-123',
                },
                user: {
                    userID: 'user-123', // Authenticated as different user
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-456',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });

            await changePassword(mockCallDifferentUser as any, mockCallback);

            // Should immediately return unauthorized without any database calls
            expect(getUserByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Unauthorized access',
                    status: status.UNAUTHENTICATED,
                })
            );
        });

        it('should require correct current password', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'wrong-current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(false);

            await changePassword(mockCall as any, mockCallback);

            expect(hashFns.compareHash).toHaveBeenCalledWith(
                'wrong-current-password',
                'hashed-current-password'
            );
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Current password is incorrect',
                    status: status.UNAUTHENTICATED,
                })
            );

            // Verify password update was not attempted
            expect(hashFns.hashValue).not.toHaveBeenCalled();
            expect(updateUserByID).not.toHaveBeenCalled();
        });

        it('should validate current password before allowing change', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'correct-current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(true);
            hashFns.hashValue.mockResolvedValue('hashed-new-password');
            (updateUserByID as jest.Mock).mockResolvedValue(undefined);

            await changePassword(mockCall as any, mockCallback);

            // Verify password was validated before proceeding
            const compareHashCall = hashFns.compareHash.mock.invocationCallOrder[0];
            const hashValueCall = hashFns.hashValue.mock.invocationCallOrder[0];
            const updateUserCall = (updateUserByID as jest.Mock).mock.invocationCallOrder[0];

            expect(compareHashCall).toBeLessThan(hashValueCall);
            expect(compareHashCall).toBeLessThan(updateUserCall);
        });
    });

    describe('password hashing', () => {
        it('should hash the new password before storing', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'my-new-secure-password',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(true);
            hashFns.hashValue.mockResolvedValue('securely-hashed-new-password');
            (updateUserByID as jest.Mock).mockResolvedValue(undefined);

            await changePassword(mockCall as any, mockCallback);

            // Verify new password is hashed
            expect(hashFns.hashValue).toHaveBeenCalledWith('my-new-secure-password');
            
            // Verify hashed password is stored, not plain text
            expect(updateUserByID).toHaveBeenCalledWith('user-123', {
                password: 'securely-hashed-new-password',
            });
        });

        it('should not store plain text password', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'plain-text-password',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(true);
            hashFns.hashValue.mockResolvedValue('hashed-version');
            (updateUserByID as jest.Mock).mockResolvedValue(undefined);

            await changePassword(mockCall as any, mockCallback);

            // Verify plain text password is never passed to updateUserByID
            expect(updateUserByID).not.toHaveBeenCalledWith('user-123', {
                password: 'plain-text-password',
            });

            // Verify only hashed version is stored
            expect(updateUserByID).toHaveBeenCalledWith('user-123', {
                password: 'hashed-version',
            });
        });
    });

    describe('performance and optimization', () => {
        it('should not unnecessarily hash password if current password is wrong', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'wrong-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(false);

            await changePassword(mockCall as any, mockCallback);

            // Verify new password hashing was skipped due to current password failure
            expect(hashFns.hashValue).not.toHaveBeenCalled();
            expect(updateUserByID).not.toHaveBeenCalled();
        });

        it('should not lookup user if authorization fails early', async () => {
            const mockCallUnauthorized = {
                request: {
                    id: 'user-456',
                    current_password: 'current-password',
                    new_password: 'new-password-123',
                },
                user: {
                    userID: 'user-123',
                },
            };

            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-456',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });

            await changePassword(mockCallUnauthorized as any, mockCallback);

            // Verify no unnecessary database calls were made
            expect(getUserByID).not.toHaveBeenCalled();
        });
    });

    describe('data integrity', () => {
        it('should only update password field', async () => {
            utilFns.removeEmptyFields.mockReturnValue({
                id: 'user-123',
                current_password: 'current-password',
                new_password: 'new-password-123',
            });
            (getUserByID as jest.Mock).mockResolvedValue(mockUser);
            hashFns.compareHash.mockResolvedValue(true);
            hashFns.hashValue.mockResolvedValue('hashed-new-password');
            (updateUserByID as jest.Mock).mockResolvedValue(undefined);

            await changePassword(mockCall as any, mockCallback);

            // Verify only password field is updated
            expect(updateUserByID).toHaveBeenCalledWith('user-123', {
                password: 'hashed-new-password',
            });

            // Verify no other fields are included in update
            expect(updateUserByID).not.toHaveBeenCalledWith('user-123', 
                expect.objectContaining({
                    email: expect.anything(),
                    first_name: expect.anything(),
                    last_name: expect.anything(),
                    is_verified: expect.anything(),
                })
            );
        });
    });
});