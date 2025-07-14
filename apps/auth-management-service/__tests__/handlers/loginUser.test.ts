// __tests__/handlers/loginUser.test.ts
import { jest } from '@jest/globals';
import { status } from '@grpc/grpc-js';
import { loginUser } from '../../src/handlers/loginUser';
import * as modelServices from '../../src/services/model-services';
import {
    errorMessage,
    responseMessage,
    hashFns,
    tokenFns,
    UserRoleEnum,
} from '@atc/common';

// Mock the model services
jest.mock('../../src/services/model-services');

describe('LoginUser Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        mockCallback = jest.fn();
        jest.clearAllMocks();
    });

    describe('Successful user login', () => {
        it('should login user successfully with valid credentials', async () => {
            // Arrange
            const mockRequest = {
                email: 'test@example.com',
                password: 'password123',
                role: UserRoleEnum.USER,
            };
            mockCall = { request: mockRequest };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                password: 'hashedPassword',
                role: UserRoleEnum.USER,
                is_verified: true,
                first_name: 'John',
                last_name: 'Doe',
                age: 25,
                address: '123 Main St',
                city: 'New York',
                no_of_adult: 1,
                no_of_children: 0,
                postcode: '10001',
                phone_number: '+1234567890',
            };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );
            (hashFns.compareHash as jest.Mock).mockResolvedValue(true);
            (tokenFns.generateToken as jest.Mock)
                .mockReturnValueOnce('mock-access-token')
                .mockReturnValueOnce('mock-refresh-token');
            (modelServices.addUserLoginActivity as jest.Mock).mockResolvedValue(
                true,
            );

            // Act
            await loginUser(mockCall, mockCallback);

            // Assert
            expect(modelServices.getUserByEmail).toHaveBeenCalledWith(
                'test@example.com',
            );
            expect(hashFns.compareHash).toHaveBeenCalledWith(
                'password123',
                'hashedPassword',
            );
            expect(tokenFns.generateToken).toHaveBeenCalledTimes(2);
            expect(modelServices.addUserLoginActivity).toHaveBeenCalledWith(
                'user-id-123',
            );
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.USER.LOGGED_IN,
                data: {
                    id: 'user-id-123',
                    email: 'test@example.com',
                    first_name: 'John',
                    last_name: 'Doe',
                    sample_registered: true,
                },
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
                status: status.OK,
            });
        });

        it('should not add login activity for admin users', async () => {
            // Arrange
            const mockRequest = {
                email: 'admin@example.com',
                password: 'password123',
                role: UserRoleEnum.ADMIN,
            };
            mockCall = { request: mockRequest };

            const mockUser = {
                id: 'admin-id-123',
                email: 'admin@example.com',
                password: 'hashedPassword',
                role: UserRoleEnum.ADMIN,
                is_verified: true,
                first_name: 'Admin',
                last_name: 'User',
            };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );
            (hashFns.compareHash as jest.Mock).mockResolvedValue(true);
            (tokenFns.generateToken as jest.Mock)
                .mockReturnValueOnce('mock-access-token')
                .mockReturnValueOnce('mock-refresh-token');

            // Act
            await loginUser(mockCall, mockCallback);

            // Assert
            expect(modelServices.addUserLoginActivity).not.toHaveBeenCalled();
        });
    });

    describe('User not found', () => {
        it('should return error when user does not exist', async () => {
            // Arrange
            const mockRequest = {
                email: 'nonexistent@example.com',
                password: 'password123',
                role: UserRoleEnum.USER,
            };
            mockCall = { request: mockRequest };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(null);

            // Act
            await loginUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.USER.NOT_REGISTERED,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.NOT_FOUND,
            });
        });
    });

    describe('Role mismatch', () => {
        it('should return error when user role does not match', async () => {
            // Arrange
            const mockRequest = {
                email: 'user@example.com',
                password: 'password123',
                role: UserRoleEnum.ADMIN,
            };
            mockCall = { request: mockRequest };

            const mockUser = {
                id: 'user-id-123',
                email: 'user@example.com',
                role: UserRoleEnum.USER,
                is_verified: true,
            };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );

            // Act
            await loginUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.USER.ROLE_MISMATCH,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.UNAUTHENTICATED,
            });
        });
    });

    describe('User not verified', () => {
        it('should return error when user is not verified', async () => {
            // Arrange
            const mockRequest = {
                email: 'unverified@example.com',
                password: 'password123',
                role: UserRoleEnum.USER,
            };
            mockCall = { request: mockRequest };

            const mockUser = {
                id: 'user-id-123',
                email: 'unverified@example.com',
                role: UserRoleEnum.USER,
                is_verified: false,
            };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );

            // Act
            await loginUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.USER.NOT_VERIFIED,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.UNAUTHENTICATED,
            });
        });
    });

    describe('Invalid password', () => {
        it('should return error when password is incorrect', async () => {
            // Arrange
            const mockRequest = {
                email: 'test@example.com',
                password: 'wrongpassword',
                role: UserRoleEnum.USER,
            };
            mockCall = { request: mockRequest };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                password: 'hashedPassword',
                role: UserRoleEnum.USER,
                is_verified: true,
            };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );
            (hashFns.compareHash as jest.Mock).mockResolvedValue(false);

            // Act
            await loginUser(mockCall, mockCallback);

            // Assert
            expect(hashFns.compareHash).toHaveBeenCalledWith(
                'wrongpassword',
                'hashedPassword',
            );
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.PASSWORD.INVALID,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.UNAUTHENTICATED,
            });
        });
    });

    describe('Sample registration status', () => {
        it('should return sample_registered as false when user data is incomplete', async () => {
            // Arrange
            const mockRequest = {
                email: 'test@example.com',
                password: 'password123',
                role: UserRoleEnum.USER,
            };
            mockCall = { request: mockRequest };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                password: 'hashedPassword',
                role: UserRoleEnum.USER,
                is_verified: true,
                first_name: 'John',
                last_name: null, // Missing data
                age: null,
                address: null,
                city: null,
                no_of_adult: null,
                no_of_children: null,
                postcode: null,
                phone_number: null,
            };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );
            (hashFns.compareHash as jest.Mock).mockResolvedValue(true);
            (tokenFns.generateToken as jest.Mock)
                .mockReturnValueOnce('mock-access-token')
                .mockReturnValueOnce('mock-refresh-token');
            (modelServices.addUserLoginActivity as jest.Mock).mockResolvedValue(
                true,
            );

            // Act
            await loginUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: expect.objectContaining({
                        sample_registered: false,
                    }),
                }),
            );
        });
    });

    describe('Error handling', () => {
        it('should handle database errors gracefully', async () => {
            // Arrange
            const mockRequest = {
                email: 'test@example.com',
                password: 'password123',
                role: UserRoleEnum.USER,
            };
            mockCall = { request: mockRequest };

            (modelServices.getUserByEmail as jest.Mock).mockRejectedValue(
                new Error('Database error'),
            );

            // Act
            await loginUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.USER.LOGIN_FAILED,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.INTERNAL,
            });
        });

        it('should handle token generation errors', async () => {
            // Arrange
            const mockRequest = {
                email: 'test@example.com',
                password: 'password123',
                role: UserRoleEnum.USER,
            };
            mockCall = { request: mockRequest };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                password: 'hashedPassword',
                role: UserRoleEnum.USER,
                is_verified: true,
            };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser,
            );
            (hashFns.compareHash as jest.Mock).mockResolvedValue(true);
            (tokenFns.generateToken as jest.Mock).mockImplementation(() => {
                throw new Error('Token generation failed');
            });

            // Act
            await loginUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.USER.LOGIN_FAILED,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.INTERNAL,
            });
        });
    });
});
