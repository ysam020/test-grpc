// __tests__/handlers/registerUser.test.ts
import { jest } from '@jest/globals';
import { status } from '@grpc/grpc-js';
import { registerUser } from '../../src/handlers/registerUser';
import * as modelServices from '../../src/services/model-services';
import {
    errorMessage,
    responseMessage,
    hashFns,
    tokenFns,
    utilFns,
    sendEmail,
} from '@atc/common';

// Mock the model services
jest.mock('../../src/services/model-services');

describe('RegisterUser Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        mockCallback = jest.fn();
        jest.clearAllMocks();
    });

    describe('Successful user registration', () => {
        it('should register a new user successfully', async () => {
            // Arrange
            const mockRequest = {
                email: 'test@example.com',
                password: 'password123',
            };
            mockCall = { request: mockRequest };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                is_verified: false,
            };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(null);
            (hashFns.generateHash as jest.Mock).mockResolvedValue(
                'hashedPassword',
            );
            (modelServices.createUser as jest.Mock).mockResolvedValue(mockUser);
            (tokenFns.generateToken as jest.Mock).mockReturnValue('mock-token');
            (utilFns.generateRandomNumber as jest.Mock).mockReturnValue(123456);
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await registerUser(mockCall, mockCallback);

            // Assert
            expect(modelServices.getUserByEmail).toHaveBeenCalledWith(
                'test@example.com',
            );
            expect(hashFns.generateHash).toHaveBeenCalledWith('password123');
            expect(modelServices.createUser).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'hashedPassword',
                otp: 123456,
            });
            expect(tokenFns.generateToken).toHaveBeenCalled();
            expect(sendEmail).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.USER.REGISTERED,
                status: status.OK,
                token: 'mock-token',
            });
        });
    });

    describe('User already exists', () => {
        it('should return error when user already exists', async () => {
            // Arrange
            const mockRequest = {
                email: 'existing@example.com',
                password: 'password123',
            };
            mockCall = { request: mockRequest };

            const existingUser = {
                id: 'existing-user-id',
                email: 'existing@example.com',
                is_verified: true,
            };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(
                existingUser,
            );

            // Act
            await registerUser(mockCall, mockCallback);

            // Assert
            expect(modelServices.getUserByEmail).toHaveBeenCalledWith(
                'existing@example.com',
            );
            expect(hashFns.generateHash).not.toHaveBeenCalled();
            expect(modelServices.createUser).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.USER.ALREADY_EXISTS,
                status: status.ALREADY_EXISTS,
                token: '',
            });
        });
    });

    describe('Database error handling', () => {
        it('should handle getUserByEmail error', async () => {
            // Arrange
            const mockRequest = {
                email: 'test@example.com',
                password: 'password123',
            };
            mockCall = { request: mockRequest };

            (modelServices.getUserByEmail as jest.Mock).mockRejectedValue(
                new Error('Database error'),
            );

            // Act
            await registerUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
                token: '',
            });
        });

        it('should handle createUser failure', async () => {
            // Arrange
            const mockRequest = {
                email: 'test@example.com',
                password: 'password123',
            };
            mockCall = { request: mockRequest };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(null);
            (hashFns.generateHash as jest.Mock).mockResolvedValue(
                'hashedPassword',
            );
            (modelServices.createUser as jest.Mock).mockResolvedValue(null);
            (utilFns.generateRandomNumber as jest.Mock).mockReturnValue(123456);

            // Act
            await registerUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
                token: '',
            });
        });
    });

    describe('Email sending', () => {
        it('should continue registration even if email sending fails', async () => {
            // Arrange
            const mockRequest = {
                email: 'test@example.com',
                password: 'password123',
            };
            mockCall = { request: mockRequest };

            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                is_verified: false,
            };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(null);
            (hashFns.generateHash as jest.Mock).mockResolvedValue(
                'hashedPassword',
            );
            (modelServices.createUser as jest.Mock).mockResolvedValue(mockUser);
            (tokenFns.generateToken as jest.Mock).mockReturnValue('mock-token');
            (utilFns.generateRandomNumber as jest.Mock).mockReturnValue(123456);
            (sendEmail as jest.Mock).mockRejectedValue(
                new Error('Email service down'),
            );

            // Act
            await registerUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.USER.REGISTERED,
                status: status.OK,
                token: 'mock-token',
            });
        });
    });

    describe('Input validation', () => {
        it('should handle empty email', async () => {
            // Arrange
            const mockRequest = {
                email: '',
                password: 'password123',
            };
            mockCall = { request: mockRequest };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(null);

            // Act
            await registerUser(mockCall, mockCallback);

            // Assert
            expect(modelServices.getUserByEmail).toHaveBeenCalledWith('');
        });

        it('should handle empty password', async () => {
            // Arrange
            const mockRequest = {
                email: 'test@example.com',
                password: '',
            };
            mockCall = { request: mockRequest };

            (modelServices.getUserByEmail as jest.Mock).mockResolvedValue(null);
            (hashFns.generateHash as jest.Mock).mockResolvedValue('');

            // Act
            await registerUser(mockCall, mockCallback);

            // Assert
            expect(hashFns.generateHash).toHaveBeenCalledWith('');
        });
    });
});
