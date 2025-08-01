import { authorizeGoogle } from '../../../../src/services/OAuth/google-auth';
import { AuthProviderEnum } from '@atc/common';

// Mock dependencies
jest.mock('google-auth-library', () => ({
    OAuth2Client: jest.fn().mockImplementation(() => ({
        verifyIdToken: jest.fn(),
    })),
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
    utilFns: {
        splitName: jest.fn((name: string) => {
            const parts = name.split(' ');
            return {
                first_name: parts[0] || '',
                last_name: parts.slice(1).join(' ') || '',
            };
        }),
    },
}));

import { OAuth2Client } from 'google-auth-library';

describe('Google Auth Service', () => {
    let mockVerifyIdToken: jest.MockedFunction<any>;
    const mockGoogleClient = OAuth2Client as jest.MockedClass<
        typeof OAuth2Client
    >;

    beforeEach(() => {
        jest.clearAllMocks();
        mockVerifyIdToken = jest.fn();
        mockGoogleClient.mockImplementation(
            () =>
                ({
                    verifyIdToken: mockVerifyIdToken,
                }) as any,
        );

        // Set up environment variables
        process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
        process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    });

    describe('authorizeGoogle', () => {
        const mockToken = 'mock-google-token';
        const mockPayload = {
            email: 'test@example.com',
            name: 'John Doe',
            picture: 'https://example.com/avatar.jpg',
        };

        it('should successfully authorize Google token and return user data', async () => {
            mockVerifyIdToken.mockResolvedValue({
                getPayload: () => mockPayload,
            });

            const result = await authorizeGoogle(mockToken);

            expect(mockGoogleClient).toHaveBeenCalledWith({
                clientId: 'test-google-client-id',
                clientSecret: 'test-google-client-secret',
            });

            expect(mockVerifyIdToken).toHaveBeenCalledWith({
                idToken: mockToken,
            });

            expect(result).toEqual({
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Doe',
                auth: AuthProviderEnum.GOOGLE,
                picture: 'https://example.com/avatar.jpg',
            });
        });

        it('should handle names with single word correctly', async () => {
            const singleNamePayload = {
                ...mockPayload,
                name: 'John',
            };

            mockVerifyIdToken.mockResolvedValue({
                getPayload: () => singleNamePayload,
            });

            const result = await authorizeGoogle(mockToken);

            expect(result).toEqual({
                email: 'test@example.com',
                first_name: 'John',
                last_name: '',
                auth: AuthProviderEnum.GOOGLE,
                picture: 'https://example.com/avatar.jpg',
            });
        });

        it('should handle names with multiple middle names correctly', async () => {
            const multipleNamesPayload = {
                ...mockPayload,
                name: 'John Michael Smith Doe',
            };

            mockVerifyIdToken.mockResolvedValue({
                getPayload: () => multipleNamesPayload,
            });

            const result = await authorizeGoogle(mockToken);

            expect(result).toEqual({
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Michael Smith Doe',
                auth: AuthProviderEnum.GOOGLE,
                picture: 'https://example.com/avatar.jpg',
            });
        });

        it('should handle missing picture gracefully', async () => {
            const payloadWithoutPicture = {
                email: 'test@example.com',
                name: 'John Doe',
                picture: undefined,
            };

            mockVerifyIdToken.mockResolvedValue({
                getPayload: () => payloadWithoutPicture,
            });

            const result = await authorizeGoogle(mockToken);

            expect(result).toEqual({
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Doe',
                auth: AuthProviderEnum.GOOGLE,
                picture: undefined,
            });
        });

        it('should throw error when token verification fails', async () => {
            const mockError = new Error('Invalid token');
            mockVerifyIdToken.mockRejectedValue(mockError);

            await expect(authorizeGoogle(mockToken)).rejects.toThrow(
                'Invalid token',
            );

            expect(mockVerifyIdToken).toHaveBeenCalledWith({
                idToken: mockToken,
            });
        });

        it('should log errors when token verification fails', async () => {
            const mockError = new Error('Token verification failed');
            mockVerifyIdToken.mockRejectedValue(mockError);

            try {
                await authorizeGoogle(mockToken);
            } catch (error) {
                // Expected to throw
            }

            const { logger } = require('@atc/logger');
            expect(logger.error).toHaveBeenCalledWith(
                'Token verification failed',
            );
        });
    });
});
