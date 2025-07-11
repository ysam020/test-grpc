// apps/api-gateway-service/__tests__/unit/controllers/user.controller.test.ts
import { Request, Response } from 'express';
import {
    getSingleUser,
    getUsers,
} from '../../../src/controllers/user.controller';

// Mock the gRPC client
jest.mock('../../../src/client', () => ({
    userStub: {
        GetSingleUser: jest.fn(),
        GetUsers: jest.fn(),
    },
}));

// Mock @atc/common utilities
jest.mock('@atc/common', () => ({
    asyncHandler: (fn: any) => fn,
    apiResponse: jest.fn(),
    grpcToHttpStatus: jest.fn((status) => (status === 0 ? 200 : 404)),
    utilFns: {
        createMetadata: jest.fn().mockReturnValue({}),
    },
}));

// Mock logger
jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

import { userStub } from '../../../src/client';
import { apiResponse } from '@atc/common';

describe('User Controller Unit Tests', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
        mockReq = {
            params: {},
            query: {},
            headers: {
                authorization: 'Bearer mock-token',
            },
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    describe('getSingleUser controller', () => {
        it('should return user data successfully', async () => {
            mockReq.params = { id: '123' };

            const mockGrpcResponse = {
                status: 0, // OK
                message: 'User found',
                data: {
                    id: '123',
                    email: 'user@example.com',
                    first_name: 'John',
                    last_name: 'Doe',
                },
            };

            (userStub.GetSingleUser as jest.Mock).mockImplementation(
                (request, metadata, callback) => {
                    callback(null, mockGrpcResponse);
                },
            );

            await getSingleUser(mockReq as Request, mockRes as Response);

            expect(userStub.GetSingleUser).toHaveBeenCalledWith(
                { id: '123' },
                {},
                expect.any(Function),
            );

            expect(apiResponse).toHaveBeenCalledWith(
                mockRes,
                200,
                expect.objectContaining({
                    message: 'User found',
                    data: expect.objectContaining({
                        id: '123',
                        email: 'user@example.com',
                    }),
                }),
            );
        });

        it('should handle user not found', async () => {
            mockReq.params = { id: '999' };

            const mockGrpcError = {
                code: 5, // NOT_FOUND
                details: 'User not found',
            };

            (userStub.GetSingleUser as jest.Mock).mockImplementation(
                (request, metadata, callback) => {
                    callback(mockGrpcError, null);
                },
            );

            try {
                await getSingleUser(mockReq as Request, mockRes as Response);
            } catch (error) {
                expect(error).toBe(mockGrpcError);
            }
        });
    });

    describe('getUsers controller', () => {
        it('should return paginated users list', async () => {
            mockReq.query = { page: '1', limit: '10' };

            const mockGrpcResponse = {
                status: 0, // OK
                message: 'Users retrieved successfully',
                data: [
                    { id: '1', email: 'user1@example.com' },
                    { id: '2', email: 'user2@example.com' },
                ],
                total: 2,
                page: 1,
                limit: 10,
            };

            (userStub.GetUsers as jest.Mock).mockImplementation(
                (request, metadata, callback) => {
                    callback(null, mockGrpcResponse);
                },
            );

            await getUsers(mockReq as Request, mockRes as Response);

            expect(userStub.GetUsers).toHaveBeenCalledWith(
                { page: '1', limit: '10' },
                {},
                expect.any(Function),
            );

            expect(apiResponse).toHaveBeenCalledWith(
                mockRes,
                200,
                expect.objectContaining({
                    message: 'Users retrieved successfully',
                    data: expect.arrayContaining([
                        expect.objectContaining({ id: '1' }),
                        expect.objectContaining({ id: '2' }),
                    ]),
                }),
            );
        });
    });
});
