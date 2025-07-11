// apps/api-gateway-service/__tests__/unit/controllers/auth.controller.test.ts
import { Request, Response } from 'express';
import { login, register } from '../../../src/controllers/auth.controller';

// Mock the gRPC client
jest.mock('../../../src/client', () => ({
    clientStub: {
        loginUser: jest.fn(),
        RegisterUser: jest.fn(),
    },
}));

// Mock @atc/common utilities
jest.mock('@atc/common', () => ({
    asyncHandler: (fn: any) => fn, // Just return the function as-is for testing
    apiResponse: jest.fn(),
    grpcToHttpStatus: jest.fn((status) => (status === 0 ? 200 : 400)),
    utilFns: {
        removeEmptyFields: jest.fn((obj) => obj),
    },
}));

import { clientStub } from '../../../src/client';
import { apiResponse, grpcToHttpStatus } from '@atc/common';

describe('Auth Controller Unit Tests', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
        mockReq = {
            body: {},
            params: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    describe('login controller', () => {
        it('should handle successful login', async () => {
            mockReq.body = {
                email: 'test@example.com',
                password: 'password123',
            };
            mockReq.params = { role: 'user' };

            const mockGrpcResponse = {
                status: 0, // OK
                message: 'Login successful',
                data: {
                    id: '1',
                    email: 'test@example.com',
                    first_name: 'John',
                },
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
            };

            (clientStub.loginUser as jest.Mock).mockImplementation(
                (request, callback) => {
                    callback(null, mockGrpcResponse);
                },
            );

            await login(mockReq as Request, mockRes as Response);

            expect(clientStub.loginUser).toHaveBeenCalledWith(
                {
                    email: 'test@example.com',
                    password: 'password123',
                    role: 'user',
                },
                expect.any(Function),
            );

            expect(grpcToHttpStatus).toHaveBeenCalledWith(0);
            expect(apiResponse).toHaveBeenCalledWith(mockRes, 200, {
                message: 'Login successful',
                data: expect.objectContaining({
                    id: '1',
                    email: 'test@example.com',
                }),
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
            });
        });

        it('should handle gRPC errors', async () => {
            mockReq.body = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };
            mockReq.params = { role: 'user' };

            const mockGrpcError = {
                code: 16, // UNAUTHENTICATED
                details: 'Invalid credentials',
            };

            (clientStub.loginUser as jest.Mock).mockImplementation(
                (request, callback) => {
                    callback(mockGrpcError, null);
                },
            );

            // Since asyncHandler wraps the function, it should handle the error
            try {
                await login(mockReq as Request, mockRes as Response);
            } catch (error) {
                expect(error).toBe(mockGrpcError);
            }
        });
    });

    describe('register controller', () => {
        it('should handle successful registration', async () => {
            mockReq.body = {
                email: 'newuser@example.com',
                password: 'password123',
                first_name: 'John',
                last_name: 'Doe',
            };

            const mockGrpcResponse = {
                status: 0, // OK
                message: 'Registration successful',
                data: {
                    id: '1',
                    email: 'newuser@example.com',
                },
            };

            (clientStub.RegisterUser as jest.Mock).mockImplementation(
                (request, callback) => {
                    callback(null, mockGrpcResponse);
                },
            );

            await register(mockReq as Request, mockRes as Response);

            expect(clientStub.RegisterUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'newuser@example.com',
                    first_name: 'John',
                    last_name: 'Doe',
                }),
                expect.any(Function),
            );

            expect(apiResponse).toHaveBeenCalledWith(
                mockRes,
                200,
                expect.objectContaining({
                    message: 'Registration successful',
                }),
            );
        });
    });
});
