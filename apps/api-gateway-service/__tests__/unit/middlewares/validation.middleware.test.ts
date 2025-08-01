import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { validateData } from '../../../src/middlewares/validation.middleware';

// Mock @atc/common module
jest.mock('@atc/common', () => ({
    errorMessage: {
        PASSWORD: {
            INVALID: 'Invalid password',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
}));

// Mock zod-validation-error
jest.mock('zod-validation-error', () => ({
    fromZodError: jest.fn((error) => ({
        toString: () => 'Validation error message',
    })),
}));

describe('Validation Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: jest.Mock<NextFunction>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        statusMock = jest.fn().mockReturnThis();
        jsonMock = jest.fn();

        mockReq = {
            body: {},
            query: {},
            params: {},
            headers: {},
            url: '/test',
        };

        mockRes = {
            status: statusMock,
            json: jsonMock,
        };

        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('Body Validation', () => {
        it('should validate body successfully with valid data', () => {
            const bodySchema = z.object({
                name: z.string(),
                age: z.number(),
            });

            mockReq.body = { name: 'John', age: 25 };

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.body).toEqual({ name: 'John', age: 25 });
            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should return error for invalid body data', () => {
            const bodySchema = z.object({
                name: z.string(),
                age: z.number(),
            });

            mockReq.body = { name: 'John', age: 'invalid' };

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Validation error message',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should transform body data after validation', () => {
            const bodySchema = z.object({
                name: z.string().trim().toLowerCase(),
                age: z.number(),
            });

            mockReq.body = { name: '  JOHN  ', age: 25 };

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.body).toEqual({ name: 'john', age: 25 });
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('Query Validation', () => {
        it('should validate query parameters successfully', () => {
            const querySchema = z.object({
                page: z.string(),
                limit: z.string(),
            });

            mockReq.query = { page: '1', limit: '10' };

            const middleware = validateData(undefined, querySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.query).toEqual({ page: '1', limit: '10' });
            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should return error for invalid query parameters', () => {
            const querySchema = z.object({
                page: z.number(), // This will fail when given a string
                limit: z.number(),
            });

            mockReq.query = { page: 'invalid', limit: '10' };

            const middleware = validateData(undefined, querySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Validation error message',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('Params Validation', () => {
        it('should validate params successfully', () => {
            const paramSchema = z.object({
                id: z.string().uuid(),
            });

            mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

            const middleware = validateData(undefined, undefined, paramSchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should return error for invalid params', () => {
            const paramSchema = z.object({
                id: z.string().uuid(),
            });

            mockReq.params = { id: 'invalid-uuid' };

            const middleware = validateData(undefined, undefined, paramSchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Validation error message',
            });
        });
    });

    describe('Headers Validation', () => {
        it('should validate headers successfully', () => {
            const headerSchema = z.object({
                authorization: z.string(),
                'content-type': z.string(),
            });

            mockReq.headers = {
                authorization: 'Bearer token',
                'content-type': 'application/json',
            };

            const middleware = validateData(
                undefined,
                undefined,
                undefined,
                headerSchema,
            );
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should return error for missing required headers', () => {
            const headerSchema = z.object({
                authorization: z.string(),
                'content-type': z.string(),
            });

            mockReq.headers = {
                'content-type': 'application/json',
            };

            const middleware = validateData(
                undefined,
                undefined,
                undefined,
                headerSchema,
            );
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Validation error message',
            });
        });
    });

    describe('Multiple Schema Validation', () => {
        it('should validate all schemas when all are provided', () => {
            const bodySchema = z.object({ name: z.string() });
            const querySchema = z.object({ page: z.string() });
            const paramSchema = z.object({ id: z.string() });
            const headerSchema = z.object({ authorization: z.string() });

            mockReq = {
                body: { name: 'John' },
                query: { page: '1' },
                params: { id: '123' },
                headers: { authorization: 'Bearer token' },
                url: '/test',
            };

            const middleware = validateData(
                bodySchema,
                querySchema,
                paramSchema,
                headerSchema,
            );
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should fail if any schema validation fails', () => {
            const bodySchema = z.object({ name: z.string() });
            const querySchema = z.object({ page: z.string() });

            mockReq = {
                body: { name: 'John' },
                query: { page: 123 }, // Should be string
                url: '/test',
            };

            const middleware = validateData(bodySchema, querySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('Password Error Handling', () => {
        it('should return specific password error for login route with password validation error', () => {
            const bodySchema = z.object({
                email: z.string().email(),
                password: z.string().min(6),
            });

            mockReq.body = { email: 'test@example.com', password: '123' };
            mockReq.url = '/login';

            // Mock ZodError with password path
            const zodError = new ZodError([
                {
                    code: 'too_small',
                    minimum: 6,
                    type: 'string',
                    inclusive: true,
                    exact: false,
                    message: 'String must contain at least 6 characters',
                    path: ['password'],
                },
            ]);

            jest.spyOn(bodySchema, 'parse').mockImplementation(() => {
                throw zodError;
            });

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Invalid password',
            });
        });

        it('should return general validation error for non-login routes with password error', () => {
            const bodySchema = z.object({
                password: z.string().min(6),
            });

            mockReq.body = { password: '123' };
            mockReq.url = '/register';

            const zodError = new ZodError([
                {
                    code: 'too_small',
                    minimum: 6,
                    type: 'string',
                    inclusive: true,
                    exact: false,
                    message: 'String must contain at least 6 characters',
                    path: ['password'],
                },
            ]);

            jest.spyOn(bodySchema, 'parse').mockImplementation(() => {
                throw zodError;
            });

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Validation error message',
            });
        });

        it('should return general validation error for login route with non-password error', () => {
            const bodySchema = z.object({
                email: z.string().email(),
                password: z.string(),
            });

            mockReq.body = {
                email: 'invalid-email',
                password: 'validpassword',
            };
            mockReq.url = '/login';

            const zodError = new ZodError([
                {
                    code: 'invalid_string',
                    validation: 'email',
                    message: 'Invalid email',
                    path: ['email'],
                },
            ]);

            jest.spyOn(bodySchema, 'parse').mockImplementation(() => {
                throw zodError;
            });

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Validation error message',
            });
        });
    });

    describe('ZodEffects Validation', () => {
        it('should handle ZodEffects schemas correctly', () => {
            const bodySchema = z
                .object({
                    password: z.string(),
                    confirmPassword: z.string(),
                })
                .refine((data) => data.password === data.confirmPassword, {
                    message: "Passwords don't match",
                    path: ['confirmPassword'],
                });

            mockReq.body = { password: 'test123', confirmPassword: 'test123' };

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should handle ZodEffects validation errors', () => {
            const bodySchema = z
                .object({
                    password: z.string(),
                    confirmPassword: z.string(),
                })
                .refine((data) => data.password === data.confirmPassword, {
                    message: "Passwords don't match",
                    path: ['confirmPassword'],
                });

            mockReq.body = {
                password: 'test123',
                confirmPassword: 'different',
            };

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Validation error message',
            });
        });
    });

    describe('Non-Zod Error Handling', () => {
        it('should handle non-ZodError exceptions', () => {
            const bodySchema = z.object({
                name: z.string(),
            });

            jest.spyOn(bodySchema, 'parse').mockImplementation(() => {
                throw new Error('Unexpected error');
            });

            mockReq.body = { name: 'John' };

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Something went wrong',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('Optional Schemas', () => {
        it('should work with no schemas provided', () => {
            const middleware = validateData();
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should skip validation for undefined schemas', () => {
            const bodySchema = z.object({ name: z.string() });

            mockReq = {
                body: { name: 'John' },
                query: { invalid: 'data' }, // This should be ignored since no querySchema
                url: '/test',
            };

            const middleware = validateData(
                bodySchema,
                undefined,
                undefined,
                undefined,
            );
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.body).toEqual({ name: 'John' });
            expect(mockReq.query).toEqual({ invalid: 'data' }); // Unchanged
        });
    });

    describe('URL Edge Cases', () => {
        it('should handle undefined URL gracefully', () => {
            const bodySchema = z.object({
                password: z.string().min(6),
            });

            mockReq.body = { password: '123' };
            mockReq.url = undefined;

            const zodError = new ZodError([
                {
                    code: 'too_small',
                    minimum: 6,
                    type: 'string',
                    inclusive: true,
                    exact: false,
                    message: 'String must contain at least 6 characters',
                    path: ['password'],
                },
            ]);

            jest.spyOn(bodySchema, 'parse').mockImplementation(() => {
                throw zodError;
            });

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Validation error message',
            });
        });

        it('should handle URL that does not start with /login', () => {
            const bodySchema = z.object({
                password: z.string().min(6),
            });

            mockReq.body = { password: '123' };
            mockReq.url = '/different-endpoint';

            const zodError = new ZodError([
                {
                    code: 'too_small',
                    minimum: 6,
                    type: 'string',
                    inclusive: true,
                    exact: false,
                    message: 'String must contain at least 6 characters',
                    path: ['password'],
                },
            ]);

            jest.spyOn(bodySchema, 'parse').mockImplementation(() => {
                throw zodError;
            });

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Validation error message',
            });
        });
    });

    describe('Complex Validation Scenarios', () => {
        it('should handle nested object validation', () => {
            const bodySchema = z.object({
                user: z.object({
                    name: z.string(),
                    email: z.string().email(),
                    profile: z.object({
                        age: z.number().min(18),
                        city: z.string(),
                    }),
                }),
            });

            mockReq.body = {
                user: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    profile: {
                        age: 25,
                        city: 'New York',
                    },
                },
            };

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should handle array validation', () => {
            const bodySchema = z.object({
                tags: z.array(z.string()),
                numbers: z.array(z.number()),
            });

            mockReq.body = {
                tags: ['tag1', 'tag2', 'tag3'],
                numbers: [1, 2, 3, 4, 5],
            };

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should handle optional fields correctly', () => {
            const bodySchema = z.object({
                name: z.string(),
                email: z.string().email().optional(),
                age: z.number().optional(),
            });

            mockReq.body = {
                name: 'John Doe',
                // email and age are optional and not provided
            };

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should handle default values', () => {
            const querySchema = z.object({
                page: z.string().optional().default('1'),
                limit: z.string().optional().default('10'),
            });

            mockReq.query = {}; // Empty query

            const middleware = validateData(undefined, querySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
            expect(mockReq.query).toEqual({ page: '1', limit: '10' });
        });

        it('should handle custom validation messages', () => {
            const bodySchema = z.object({
                email: z.string().email('Please provide a valid email address'),
                password: z
                    .string()
                    .min(8, 'Password must be at least 8 characters long'),
            });

            mockReq.body = {
                email: 'invalid-email',
                password: 'short',
            };

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Validation error message',
            });
        });
    });

    describe('Error Message Formatting', () => {
        it('should handle multiple validation errors', () => {
            const bodySchema = z.object({
                name: z.string().min(2),
                email: z.string().email(),
                age: z.number().min(18),
            });

            mockReq.body = {
                name: 'A', // Too short
                email: 'invalid-email', // Invalid email
                age: 15, // Too young
            };

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Validation error message',
            });
        });

        it('should handle password error detection with nested password fields', () => {
            const bodySchema = z.object({
                user: z.object({
                    password: z.string().min(6),
                }),
            });

            mockReq.body = {
                user: {
                    password: '123',
                },
            };
            mockReq.url = '/login';

            const zodError = new ZodError([
                {
                    code: 'too_small',
                    minimum: 6,
                    type: 'string',
                    inclusive: true,
                    exact: false,
                    message: 'String must contain at least 6 characters',
                    path: ['user', 'password'],
                },
            ]);

            jest.spyOn(bodySchema, 'parse').mockImplementation(() => {
                throw zodError;
            });

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Invalid password',
            });
        });
    });

    describe('Middleware Integration', () => {
        it('should work as Express middleware', () => {
            const bodySchema = z.object({
                name: z.string(),
            });

            const middleware = validateData(bodySchema);

            // Verify it returns a function that takes req, res, next
            expect(typeof middleware).toBe('function');
            expect(middleware.length).toBe(3); // req, res, next parameters
        });

        it('should preserve request object properties not being validated', () => {
            const bodySchema = z.object({
                name: z.string(),
            });

            mockReq = {
                body: { name: 'John', extra: 'data' },
                query: { search: 'test' },
                params: { id: '123' },
                headers: { authorization: 'Bearer token' },
                url: '/test',
                method: 'POST',
                ip: '127.0.0.1',
            };

            const middleware = validateData(bodySchema);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            // Only body should be validated and potentially modified
            expect(mockReq.query).toEqual({ search: 'test' });
            expect(mockReq.params).toEqual({ id: '123' });
            expect(mockReq.headers).toEqual({ authorization: 'Bearer token' });
            expect(mockReq.method).toBe('POST');
            expect(mockReq.ip).toBe('127.0.0.1');
        });
    });
});
