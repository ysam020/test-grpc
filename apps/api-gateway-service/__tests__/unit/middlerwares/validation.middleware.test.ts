// apps/api-gateway-service/__tests__/unit/middlewares/validation.middleware.test.ts
import { Request, Response, NextFunction } from 'express';
import { validateData } from '../../../src/middlewares/validation.middleware';
import { z } from 'zod';

// Mock @atc/common to avoid database dependency issues
jest.mock('@atc/common', () => ({
    errorMessage: {
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
        PASSWORD: {
            INVALID: 'Invalid password',
        },
    },
}));

describe('Validation Middleware Unit Tests', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = {
            body: {},
            query: {},
            params: {},
            headers: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        mockNext = jest.fn();
    });

    describe('validateData middleware', () => {
        it('should call next() when validation passes', () => {
            const bodySchema = z.object({
                name: z.string().min(1),
                email: z.string().email(),
            });

            mockReq.body = {
                name: 'John Doe',
                email: 'john@example.com',
            };

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return 400 error when body validation fails', () => {
            const bodySchema = z.object({
                name: z.string().min(1),
                email: z.string().email(),
            });

            mockReq.body = {
                name: '', // Invalid: empty string
                email: 'invalid-email', // Invalid: not an email
            };

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: expect.stringContaining(
                    'String must contain at least 1 character(s)',
                ),
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should validate query parameters correctly', () => {
            const querySchema = z.object({
                page: z.string().regex(/^\d+$/),
                limit: z.string().regex(/^\d+$/),
            });

            mockReq.query = {
                page: '1',
                limit: '10',
            };

            const middleware = validateData(undefined, querySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
        });

        it('should validate route parameters correctly', () => {
            const paramSchema = z.object({
                id: z.string().uuid(),
            });

            mockReq.params = {
                id: '123e4567-e89b-12d3-a456-426614174000',
            };

            const middleware = validateData(undefined, undefined, paramSchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
        });

        it('should handle password validation errors specially', () => {
            const bodySchema = z.object({
                password: z.string().min(8),
            });

            mockReq.body = { password: '123' }; // Too short
            mockReq.url = '/login';

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Invalid password',
            });
        });
    });
});

// ===================================================================

// ===================================================================

// ===================================================================

// ===================================================================
