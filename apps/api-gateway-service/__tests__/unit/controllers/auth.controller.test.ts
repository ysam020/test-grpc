import {
    register,
    verifyEmail,
    resendEmail,
    login,
    forgotPassword,
    resetPassword,
    refreshToken,
    oauthRegister,
} from '../../../src/controllers/auth.controller';

import { clientStub } from '../../../src/client';

// Reassign individual mocked functions
const mockFns = {
    RegisterUser: jest.fn(),
    VerifyUser: jest.fn(),
    resendEmail: jest.fn(),
    loginUser: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    refreshToken: jest.fn(),
    oauthRegister: jest.fn(),
};

jest.mock('../../../src/client', () => ({
    clientStub: {
        RegisterUser: jest.fn(),
        VerifyUser: jest.fn(),
        resendEmail: jest.fn(),
        loginUser: jest.fn(),
        forgotPassword: jest.fn(),
        resetPassword: jest.fn(),
        refreshToken: jest.fn(),
        oauthRegister: jest.fn(),
    },
}));

jest.mock('@atc/common', () => ({
    apiResponse: jest.fn((res, statusCode, data) =>
        res.status(statusCode).json({ success: true, data }),
    ),
    asyncHandler: (fn) => fn,
    utilFns: {
        removeEmptyFields: jest.fn((body) => body),
    },
    grpcToHttpStatus: jest.fn(() => 200),
}));

// Assign mocks to clientStub
Object.assign(clientStub, mockFns);

const mockRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
});

describe('Auth Controller', () => {
    const commonBody = { email: 'sameer@example.com', password: 'test123' };

    it('register should call RegisterUser', async () => {
        const req = { body: { name: 'Sameer', ...commonBody } } as any;
        const res = mockRes();
        const response = {
            status: 'SUCCESS',
            user: { id: '123', email: req.body.email },
        };
        mockFns.RegisterUser.mockImplementation((_b, cb) => cb(null, response));

        await register(req, res);

        expect(mockFns.RegisterUser).toHaveBeenCalledWith(
            req.body,
            expect.any(Function),
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('verifyEmail should call VerifyUser', async () => {
        const req = { body: commonBody } as any;
        const res = mockRes();
        const response = { status: 'SUCCESS', verified: true };
        mockFns.VerifyUser.mockImplementation((_b, cb) => cb(null, response));

        await verifyEmail(req, res);

        expect(mockFns.VerifyUser).toHaveBeenCalledWith(
            req.body,
            expect.any(Function),
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('resendEmail should call resendEmail', async () => {
        const req = { body: commonBody } as any;
        const res = mockRes();
        const response = { status: 'SUCCESS', message: 'Email sent' };
        mockFns.resendEmail.mockImplementation((_b, cb) => cb(null, response));

        await resendEmail(req, res);

        expect(mockFns.resendEmail).toHaveBeenCalledWith(
            req.body,
            expect.any(Function),
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('login should call loginUser', async () => {
        const req = { body: commonBody, params: {} } as any;
        const res = mockRes();
        const response = { status: 'SUCCESS', token: 'abc123' };
        mockFns.loginUser.mockImplementation((_b, cb) => cb(null, response));

        await login(req, res);

        expect(mockFns.loginUser).toHaveBeenCalledWith(
            expect.objectContaining(req.body),
            expect.any(Function),
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('forgotPassword should call forgotPassword', async () => {
        const req = { body: { email: 'sameer@example.com' } } as any;
        const res = mockRes();
        const response = { status: 'SUCCESS', message: 'OTP sent' };
        mockFns.forgotPassword.mockImplementation((_b, cb) =>
            cb(null, response),
        );

        await forgotPassword(req, res);

        expect(mockFns.forgotPassword).toHaveBeenCalledWith(
            req.body,
            expect.any(Function),
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('resetPassword should call resetPassword', async () => {
        const req = {
            body: { token: 'reset-token', newPassword: 'NewPass123' },
        } as any;
        const res = mockRes();
        const response = { status: 'SUCCESS', message: 'Password reset' };
        mockFns.resetPassword.mockImplementation((_b, cb) =>
            cb(null, response),
        );

        await resetPassword(req, res);

        expect(mockFns.resetPassword).toHaveBeenCalledWith(
            req.body,
            expect.any(Function),
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('refreshToken should call refreshToken', async () => {
        const req = { body: { refresh_token: 'refresh-token-123' } } as any;
        const res = mockRes();
        const response = { status: 'SUCCESS', token: 'new-jwt-token' };
        mockFns.refreshToken.mockImplementation((_b, cb) => cb(null, response));

        await refreshToken(req, res);

        expect(mockFns.refreshToken).toHaveBeenCalledWith(
            { refresh_token: req.body.refresh_token },
            expect.any(Function),
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('oauthRegister should call oauthRegister', async () => {
        const req = {
            body: { provider: 'google', access_token: 'abc' },
        } as any;
        const res = mockRes();
        const response = { status: 'SUCCESS', user: { id: 'google-user' } };
        mockFns.oauthRegister.mockImplementation((_b, cb) =>
            cb(null, response),
        );

        await oauthRegister(req, res);

        expect(mockFns.oauthRegister).toHaveBeenCalledWith(
            req.body,
            expect.any(Function),
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
