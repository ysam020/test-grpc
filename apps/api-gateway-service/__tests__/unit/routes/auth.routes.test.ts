// apps/api-gateway-service/__tests__/unit/routes/auth.routes.test.ts
import { Router } from 'express';
import { validateData } from '../../../src/middlewares/validation.middleware';

// Mock the validation middleware
jest.mock('../../../src/middlewares/validation.middleware', () => ({
    validateData: jest.fn(),
}));

// Mock the controllers
jest.mock('../../../src/controllers/auth.controller', () => ({
    register: jest.fn(),
    login: jest.fn(),
    verifyEmail: jest.fn(),
}));

// Mock @atc/common
jest.mock('@atc/common', () => ({
    authValidation: {
        registerSchema: 'mockRegisterSchema',
        loginSchema: 'mockLoginSchema',
        roleSchema: 'mockRoleSchema',
        verifyUserSchema: 'mockVerifyUserSchema',
    },
}));

// Mock Express Router
const mockRouter = {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
};

jest.mock('express', () => ({
    Router: jest.fn(() => mockRouter),
}));

describe('Auth Routes Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (validateData as jest.Mock).mockReturnValue('mockValidationMiddleware');
    });

    it('should set up auth routes correctly', async () => {
        // Import after mocking
        await import('../../../src/routes/auth.routes');

        // Verify POST /register route
        expect(mockRouter.post).toHaveBeenCalledWith(
            '/register',
            'mockValidationMiddleware',
            expect.any(Function), // register controller
        );

        // Verify POST /login/:role route
        expect(mockRouter.post).toHaveBeenCalledWith(
            '/login/:role',
            'mockValidationMiddleware',
            expect.any(Function), // login controller
        );

        // Verify POST /verify-email route
        expect(mockRouter.post).toHaveBeenCalledWith(
            '/verify-email',
            'mockValidationMiddleware',
            expect.any(Function), // verifyEmail controller
        );
    });

    it('should call validateData with correct schemas', async () => {
        await import('../../../src/routes/auth.routes');

        // Check that validateData was called with the register schema
        expect(validateData).toHaveBeenCalledWith('mockRegisterSchema');

        // Check that validateData was called with login and role schemas
        expect(validateData).toHaveBeenCalledWith(
            'mockLoginSchema',
            undefined,
            'mockRoleSchema',
        );

        // Check that validateData was called with verify user schema
        expect(validateData).toHaveBeenCalledWith('mockVerifyUserSchema');
    });
});
