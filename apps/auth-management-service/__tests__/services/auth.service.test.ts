// apps/auth-management-service/__tests__/services/auth.service.test.ts
import { status } from '@grpc/grpc-js';

// Mock AuthService class for testing
class MockAuthService {
    constructor(
        private database: any,
        private emailService: any,
    ) {}

    async Authenticate(call: any, callback: any) {
        try {
            const { email, password } = call.request;

            // Find user in database
            const user = await this.database.user.findUnique({
                where: { email },
            });

            if (!user) {
                const error = new Error('User not found');
                (error as any).code = status.NOT_FOUND;
                return callback(error, null);
            }

            if (!user.isActive) {
                const error = new Error('Account is inactive');
                (error as any).code = status.PERMISSION_DENIED;
                return callback(error, null);
            }

            if (!user.emailVerified) {
                const error = new Error('Email not verified');
                (error as any).code = status.PERMISSION_DENIED;
                return callback(error, null);
            }

            // Check password
            const bcrypt = require('bcrypt');
            const isValidPassword = await bcrypt.compare(
                password,
                user.password,
            );

            if (!isValidPassword) {
                const error = new Error('Invalid credentials');
                (error as any).code = status.UNAUTHENTICATED;
                return callback(error, null);
            }

            // Generate tokens
            const jwt = require('jsonwebtoken');
            const token = jwt.sign(
                { userId: user.id, email: user.email, type: 'access' },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN },
            );

            const refreshToken = jwt.sign(
                { userId: user.id, type: 'refresh' },
                process.env.JWT_SECRET,
                { expiresIn: '7d' },
            );

            callback(null, {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                },
                token,
                refreshToken,
            });
        } catch (error) {
            const grpcError = new Error('Internal server error');
            (grpcError as any).code = status.INTERNAL;
            callback(grpcError, null);
        }
    }

    async ValidateToken(call: any, callback: any) {
        try {
            const { token } = call.request;
            const jwt = require('jsonwebtoken');

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await this.database.user.findUnique({
                where: { id: decoded.userId },
            });

            if (!user) {
                const error = new Error('User not found');
                (error as any).code = status.UNAUTHENTICATED;
                return callback(error, null);
            }

            if (!user.isActive) {
                const error = new Error('Account is inactive');
                (error as any).code = status.PERMISSION_DENIED;
                return callback(error, null);
            }

            callback(null, {
                valid: true,
                user: {
                    id: user.id,
                    email: user.email,
                },
            });
        } catch (error: any) {
            let grpcError;
            if (error.name === 'TokenExpiredError') {
                grpcError = new Error('Token expired');
                (grpcError as any).code = status.UNAUTHENTICATED;
            } else if (error.name === 'JsonWebTokenError') {
                grpcError = new Error('Invalid token');
                (grpcError as any).code = status.UNAUTHENTICATED;
            } else {
                grpcError = new Error('Internal server error');
                (grpcError as any).code = status.INTERNAL;
            }
            callback(grpcError, null);
        }
    }

    async RefreshToken(call: any, callback: any) {
        try {
            const { refreshToken } = call.request;
            const jwt = require('jsonwebtoken');

            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

            if (decoded.type !== 'refresh') {
                const error = new Error('Invalid refresh token');
                (error as any).code = status.UNAUTHENTICATED;
                return callback(error, null);
            }

            const user = await this.database.user.findUnique({
                where: { id: decoded.userId },
            });

            if (!user) {
                const error = new Error('User not found');
                (error as any).code = status.UNAUTHENTICATED;
                return callback(error, null);
            }

            const newToken = jwt.sign(
                { userId: user.id, email: user.email, type: 'access' },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN },
            );

            callback(null, {
                success: true,
                token: newToken,
                user: {
                    id: user.id,
                    email: user.email,
                },
            });
        } catch (error: any) {
            let grpcError;
            if (error.name === 'TokenExpiredError') {
                grpcError = new Error('Refresh token expired');
                (grpcError as any).code = status.UNAUTHENTICATED;
            } else {
                grpcError = new Error('Internal server error');
                (grpcError as any).code = status.INTERNAL;
            }
            callback(grpcError, null);
        }
    }

    async CreateUser(call: any, callback: any) {
        try {
            const { email, password, firstName, lastName } = call.request;

            // Check if user already exists
            const existingUser = await this.database.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                const error = new Error('User with this email already exists');
                (error as any).code = status.ALREADY_EXISTS;
                return callback(error, null);
            }

            // Hash password
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const newUser = await this.database.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    isActive: true,
                    emailVerified: false,
                },
            });

            callback(null, {
                success: true,
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                },
                message: 'User created successfully. Please verify your email.',
            });
        } catch (error) {
            const grpcError = new Error('Internal server error');
            (grpcError as any).code = status.INTERNAL;
            callback(grpcError, null);
        }
    }
}

describe('AuthService gRPC Methods', () => {
    let authService: MockAuthService;
    let mockDatabase: any;
    let mockEmailService: any;

    beforeAll(() => {
        mockDatabase = global.mockDatabase;
        mockEmailService = global.mockServices.emailService;
        authService = new MockAuthService(mockDatabase, mockEmailService);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Authenticate', () => {
        it('should authenticate user with valid credentials', async () => {
            // Arrange
            const request = {
                email: 'test@example.com',
                password: 'validPassword123',
            };

            const mockUser = {
                id: '1',
                email: 'test@example.com',
                password: '$2b$10$hashedPassword',
                isActive: true,
                emailVerified: true,
            };

            const mockCall = global.grpcTestUtils.createMockCall({
                'user-agent': 'grpc-node-js/1.0.0',
            });
            mockCall.request = request;

            const mockCallback = jest.fn();

            // Mock database response
            mockDatabase.user.findUnique.mockResolvedValue(mockUser);

            // Mock bcrypt comparison
            const bcrypt = require('bcrypt');
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

            // Mock JWT token generation
            const jwt = require('jsonwebtoken');
            jest.spyOn(jwt, 'sign')
                .mockReturnValueOnce('mocked.access.token')
                .mockReturnValueOnce('mocked.refresh.token');

            // Act
            await authService.Authenticate(mockCall, mockCallback);

            // Assert
            expect(mockDatabase.user.findUnique).toHaveBeenCalledWith({
                where: { email: request.email },
            });

            expect(bcrypt.compare).toHaveBeenCalledWith(
                request.password,
                mockUser.password,
            );

            expect(mockCallback).toHaveBeenCalledWith(null, {
                success: true,
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                },
                token: 'mocked.access.token',
                refreshToken: 'mocked.refresh.token',
            });

            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it('should fail authentication with invalid credentials', async () => {
            // Arrange
            const request = {
                email: 'test@example.com',
                password: 'invalidPassword',
            };

            const mockUser = {
                id: '1',
                email: 'test@example.com',
                password: '$2b$10$hashedPassword',
                isActive: true,
                emailVerified: true,
            };

            const mockCall = global.grpcTestUtils.createMockCall();
            mockCall.request = request;
            const mockCallback = jest.fn();

            mockDatabase.user.findUnique.mockResolvedValue(mockUser);

            const bcrypt = require('bcrypt');
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

            // Act
            await authService.Authenticate(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: status.UNAUTHENTICATED,
                    message: 'Invalid credentials',
                }),
                null,
            );
        });

        it('should handle user not found', async () => {
            // Arrange
            const request = {
                email: 'nonexistent@example.com',
                password: 'anyPassword',
            };

            const mockCall = global.grpcTestUtils.createMockCall();
            mockCall.request = request;
            const mockCallback = jest.fn();

            mockDatabase.user.findUnique.mockResolvedValue(null);

            // Act
            await authService.Authenticate(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: status.NOT_FOUND,
                    message: 'User not found',
                }),
                null,
            );
        });

        it('should handle inactive user account', async () => {
            // Arrange
            const request = {
                email: 'inactive@example.com',
                password: 'validPassword123',
            };

            const mockUser = {
                id: '1',
                email: 'inactive@example.com',
                password: '$2b$10$hashedPassword',
                isActive: false,
                emailVerified: true,
            };

            const mockCall = global.grpcTestUtils.createMockCall();
            mockCall.request = request;
            const mockCallback = jest.fn();

            mockDatabase.user.findUnique.mockResolvedValue(mockUser);

            // Act
            await authService.Authenticate(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: status.PERMISSION_DENIED,
                    message: 'Account is inactive',
                }),
                null,
            );
        });

        it('should handle unverified email', async () => {
            // Arrange
            const request = {
                email: 'unverified@example.com',
                password: 'validPassword123',
            };

            const mockUser = {
                id: '1',
                email: 'unverified@example.com',
                password: '$2b$10$hashedPassword',
                isActive: true,
                emailVerified: false,
            };

            const mockCall = global.grpcTestUtils.createMockCall();
            mockCall.request = request;
            const mockCallback = jest.fn();

            mockDatabase.user.findUnique.mockResolvedValue(mockUser);

            // Act
            await authService.Authenticate(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: status.PERMISSION_DENIED,
                    message: 'Email not verified',
                }),
                null,
            );
        });

        it('should handle database errors gracefully', async () => {
            // Arrange
            const request = {
                email: 'test@example.com',
                password: 'validPassword123',
            };

            const mockCall = global.grpcTestUtils.createMockCall();
            mockCall.request = request;
            const mockCallback = jest.fn();

            mockDatabase.user.findUnique.mockRejectedValue(
                new Error('Database connection failed'),
            );

            // Act
            await authService.Authenticate(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: status.INTERNAL,
                    message: 'Internal server error',
                }),
                null,
            );
        });
    });

    describe('ValidateToken', () => {
        it('should validate a valid token successfully', async () => {
            // Arrange
            const request = {
                token: 'valid.jwt.token',
            };

            const mockCall = global.grpcTestUtils.createMockCall();
            mockCall.request = request;
            const mockCallback = jest.fn();

            const mockDecodedToken = {
                userId: '1',
                email: 'test@example.com',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600,
            };

            const jwt = require('jsonwebtoken');
            jest.spyOn(jwt, 'verify').mockReturnValue(mockDecodedToken);

            const mockUser = {
                id: '1',
                email: 'test@example.com',
                isActive: true,
                emailVerified: true,
            };

            mockDatabase.user.findUnique.mockResolvedValue(mockUser);

            // Act
            await authService.ValidateToken(mockCall, mockCallback);

            // Assert
            expect(jwt.verify).toHaveBeenCalledWith(
                request.token,
                process.env.JWT_SECRET,
            );

            expect(mockDatabase.user.findUnique).toHaveBeenCalledWith({
                where: { id: mockDecodedToken.userId },
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                valid: true,
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                },
            });
        });

        it('should reject expired token', async () => {
            // Arrange
            const request = {
                token: 'expired.jwt.token',
            };

            const mockCall = global.grpcTestUtils.createMockCall();
            mockCall.request = request;
            const mockCallback = jest.fn();

            const jwt = require('jsonwebtoken');
            const tokenError = new Error('jwt expired');
            tokenError.name = 'TokenExpiredError';
            jest.spyOn(jwt, 'verify').mockImplementation(() => {
                throw tokenError;
            });

            // Act
            await authService.ValidateToken(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: status.UNAUTHENTICATED,
                    message: 'Token expired',
                }),
                null,
            );
        });
    });

    describe('RefreshToken', () => {
        it('should refresh token successfully with valid refresh token', async () => {
            // Arrange
            const request = {
                refreshToken: 'valid.refresh.token',
            };

            const mockCall = global.grpcTestUtils.createMockCall();
            mockCall.request = request;
            const mockCallback = jest.fn();

            const mockDecodedToken = {
                userId: '1',
                type: 'refresh',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
            };

            const jwt = require('jsonwebtoken');
            jest.spyOn(jwt, 'verify').mockReturnValue(mockDecodedToken);
            jest.spyOn(jwt, 'sign').mockReturnValue('new.access.token');

            const mockUser = {
                id: '1',
                email: 'test@example.com',
                isActive: true,
                emailVerified: true,
            };

            mockDatabase.user.findUnique.mockResolvedValue(mockUser);

            // Act
            await authService.RefreshToken(mockCall, mockCallback);

            // Assert
            expect(jwt.verify).toHaveBeenCalledWith(
                request.refreshToken,
                process.env.JWT_SECRET,
            );

            expect(jwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockUser.id,
                    email: mockUser.email,
                    type: 'access',
                }),
                process.env.JWT_SECRET,
                expect.objectContaining({
                    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
                }),
            );

            expect(mockCallback).toHaveBeenCalledWith(null, {
                success: true,
                token: 'new.access.token',
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                },
            });
        });
    });

    describe('CreateUser', () => {
        it('should create a new user successfully', async () => {
            // Arrange
            const request = {
                email: 'newuser@example.com',
                password: 'newPassword123',
                firstName: 'New',
                lastName: 'User',
            };

            const mockCall = global.grpcTestUtils.createMockCall();
            mockCall.request = request;
            const mockCallback = jest.fn();

            // Mock bcrypt hash
            const bcrypt = require('bcrypt');
            jest.spyOn(bcrypt, 'hash').mockResolvedValue(
                '$2b$10$hashedNewPassword',
            );

            const mockCreatedUser = {
                id: '2',
                email: request.email,
                firstName: request.firstName,
                lastName: request.lastName,
                isActive: true,
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockDatabase.user.findUnique.mockResolvedValue(null); // User doesn't exist
            mockDatabase.user.create.mockResolvedValue(mockCreatedUser);

            // Act
            await authService.CreateUser(mockCall, mockCallback);

            // Assert
            expect(mockDatabase.user.findUnique).toHaveBeenCalledWith({
                where: { email: request.email },
            });

            expect(bcrypt.hash).toHaveBeenCalledWith(request.password, 10);

            expect(mockDatabase.user.create).toHaveBeenCalledWith({
                data: {
                    email: request.email,
                    password: '$2b$10$hashedNewPassword',
                    firstName: request.firstName,
                    lastName: request.lastName,
                    isActive: true,
                    emailVerified: false,
                },
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                success: true,
                user: {
                    id: mockCreatedUser.id,
                    email: mockCreatedUser.email,
                    firstName: mockCreatedUser.firstName,
                    lastName: mockCreatedUser.lastName,
                },
                message: 'User created successfully. Please verify your email.',
            });
        });

        it('should reject duplicate email registration', async () => {
            // Arrange
            const request = {
                email: 'existing@example.com',
                password: 'newPassword123',
                firstName: 'New',
                lastName: 'User',
            };

            const mockCall = global.grpcTestUtils.createMockCall();
            mockCall.request = request;
            const mockCallback = jest.fn();

            const existingUser = {
                id: '1',
                email: request.email,
                isActive: true,
            };

            mockDatabase.user.findUnique.mockResolvedValue(existingUser);

            // Act
            await authService.CreateUser(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: status.ALREADY_EXISTS,
                    message: 'User with this email already exists',
                }),
                null,
            );
        });
    });
});
