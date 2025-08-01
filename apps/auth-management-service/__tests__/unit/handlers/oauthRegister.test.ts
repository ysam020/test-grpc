// Mock dependencies
jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));

jest.mock('@atc/common', () => ({
    errorMessage: {
        TOKEN: {
            INVALID: 'Invalid token',
            EXPIRED: 'Token expired',
            REFRESHED: 'Token refreshed successfully',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    tokenFns: {
        verifyToken: jest.fn(),
        generateToken: jest.fn(),
    },
}));

import { refreshToken } from '../../../src/handlers/refreshToken';
import { TokenExpiredError } from 'jsonwebtoken';
import { status } from '@grpc/grpc-js';

const { tokenFns } = require('@atc/common');

describe('Refresh Token Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        
        process.env.ACCESS_JWT_TOKEN = 'access-secret';
        process.env.ACCESS_JWT_EXPIRE = '15m';
        process.env.REFRESH_TOKEN = 'refresh-secret';
        process.env.REFRESH_TOKEN_EXPIRE = '7d';
    });

    const mockCall = {
        request: {
            refresh_token: 'valid-refresh-token',
        },
    };

    const mockPayload = {
        userID: 'user-123',
        role: 'USER',
        email: 'test@example.com',
    };

    describe('successful token refresh', () => {
        it('should issue new access and refresh tokens on valid refresh token', async () => {
            const newAccessToken = 'new-access-token';
            const newRefreshToken = 'new-refresh-token';

            tokenFns.verifyToken.mockReturnValue(mockPayload);
            tokenFns.generateToken
                .mockReturnValueOnce(newAccessToken)
                .mockReturnValueOnce(newRefreshToken);

            await refreshToken(mockCall as any, mockCallback);

            expect(tokenFns.verifyToken).toHaveBeenCalledWith(
                'valid-refresh-token',
                'refresh-secret'
            );

            expect(tokenFns.generateToken).toHaveBeenCalledTimes(2);
            
            // Check access token generation
            expect(tokenFns.generateToken).toHaveBeenNthCalledWith(
                1,
                mockPayload,
                'access-secret',
                { expiresIn: '15m' }
            );

            // Check refresh token generation
            expect(tokenFns.generateToken).toHaveBeenNthCalledWith(
                2,
                mockPayload,
                'refresh-secret',
                { expiresIn: '7d' }
            );

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Token refreshed successfully',
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                    status: status.OK,
                })
            );
        });
    });

    describe('token validation failures', () => {
        it('should return error when refresh token is invalid', async () => {
            tokenFns.verifyToken.mockReturnValue(null);

            await refreshToken(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Invalid token',
                    accessToken: '',
                    refreshToken: '',
                    status: status.UNAUTHENTICATED,
                })
            );
        });

        it('should return error when refresh token is expired', async () => {
            const expiredError = new TokenExpiredError('Token expired', new Date());
            tokenFns.verifyToken.mockImplementation(() => {
                throw expiredError;
            });

            await refreshToken(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Token expired',
                    accessToken: '',
                    refreshToken: '',
                    status: status.UNAUTHENTICATED,
                })
            );
        });

        it('should handle general errors', async () => {
            const generalError = new Error('Something went wrong');
            tokenFns.verifyToken.mockImplementation(() => {
                throw generalError;
            });

            await refreshToken(mockCall as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Something went wrong',
                    accessToken: '',
                    refreshToken: '',
                    status: status.INTERNAL,
                })
            );
        });
    });

    describe('edge cases', () => {
        it('should handle missing refresh token in request', async () => {
            const callWithoutToken = {
                request: {
                    refresh_token: '',
                },
            };

            tokenFns.verifyToken.mockReturnValue(null);

            await refreshToken(callWithoutToken as any, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: 'Invalid token',
                    accessToken: '',
                    refreshToken: '',
                    status: status.UNAUTHENTICATED,
                })
            );
        });

        it('should handle malformed token payload', async () => {
            const malformedPayload = {
                // Missing required fields like userID, role, email
                someOtherField: 'value',
            };

            tokenFns.verifyToken.mockReturnValue(malformedPayload);
            tokenFns.generateToken
                .mockReturnValueOnce('new-access-token')
                .mockReturnValueOnce('new-refresh-token');

            await refreshToken(mockCall as any, mockCallback);

            // Should still work but with undefined values
            expect(tokenFns.generateToken).toHaveBeenCalledWith(
                {
                    userID: undefined,
                    role: undefined,
                    email: undefined,
                },
                'access-secret',
                { expiresIn: '15m' }
            );
        });
    });
});