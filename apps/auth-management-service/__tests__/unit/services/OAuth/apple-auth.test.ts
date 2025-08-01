import { authorizeApple } from '../../../../src/services/OAuth/apple-auth';
import { AuthProviderEnum } from '@atc/common';

// Mock dependencies
jest.mock('apple-signin-auth', () => ({
    verifyIdToken: jest.fn(),
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));

jest.mock('@atc/common', () => ({
    AuthProviderEnum: {
        GOOGLE: 'google',
        APPLE: 'apple',
        META: 'meta',
        INTERNAL: 'internal',
    },
}));

import appleSignin from 'apple-signin-auth';

describe('Apple Auth Service', () => {
    const mockVerifyIdToken = appleSignin.verifyIdToken as jest.MockedFunction<
        typeof appleSignin.verifyIdToken
    >;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('authorizeApple', () => {
        const mockToken = 'mock-apple-token';
        const mockTicket = {
            email: 'test@example.com',
        };

        it('should successfully authorize Apple token and return user data', async () => {
            mockVerifyIdToken.mockResolvedValue(mockTicket);

            const result = await authorizeApple(mockToken);

            expect(mockVerifyIdToken).toHaveBeenCalledWith(mockToken);

            expect(result).toEqual({
                email: 'test@example.com',
                auth: AuthProviderEnum.APPLE,
            });
        });

        it('should throw error when token verification fails', async () => {
            const mockError = new Error('Invalid Apple token');
            mockVerifyIdToken.mockRejectedValue(mockError);

            await expect(authorizeApple(mockToken)).rejects.toThrow(
                'Invalid Apple token',
            );

            expect(mockVerifyIdToken).toHaveBeenCalledWith(mockToken);
        });

        it('should log errors when token verification fails', async () => {
            const mockError = new Error('Apple token verification failed');
            mockVerifyIdToken.mockRejectedValue(mockError);

            try {
                await authorizeApple(mockToken);
            } catch (error) {
                // Expected to throw
            }

            const { logger } = require('@atc/logger');
            expect(logger.error).toHaveBeenCalledWith(
                'Apple token verification failed',
            );
        });

        it('should handle missing email in ticket', async () => {
            const ticketWithoutEmail = {};
            mockVerifyIdToken.mockResolvedValue(ticketWithoutEmail);

            const result = await authorizeApple(mockToken);

            expect(result).toEqual({
                email: undefined,
                auth: AuthProviderEnum.APPLE,
            });
        });
    });
});
