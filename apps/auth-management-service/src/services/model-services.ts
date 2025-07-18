import { jest } from '@jest/globals';
import { AuthProviderEnum } from '@atc/common';

// Mocks
jest.mock('axios', () => ({
    get: jest.fn(),
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

import { authorizeFacebook } from '../../../../src/services/OAuth/fb-auth';
import axios from 'axios';
import { logger } from '@atc/logger';

describe('authorizeFacebook', () => {
    const mockAccessToken = 'mock-access-token';
    const mockUserId = 'mock-user-id';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return user info from Facebook API', async () => {
        (axios.get as jest.Mock).mockResolvedValue({
            data: {
                email: 'fb@example.com',
                name: 'John Doe',
                picture: { data: { url: 'http://fb.com/photo.jpg' } },
            },
        });

        const result = await authorizeFacebook(mockAccessToken, mockUserId);

        expect(result).toEqual({
            email: 'fb@example.com',
            first_name: 'John',
            last_name: 'Doe',
            auth: AuthProviderEnum.META,
            picture: 'http://fb.com/photo.jpg',
        });
    });

    it('should handle single-word name correctly', async () => {
        (axios.get as jest.Mock).mockResolvedValue({
            data: {
                email: 'fb@example.com',
                name: 'John',
                picture: { data: { url: 'http://fb.com/photo.jpg' } },
            },
        });

        const result = await authorizeFacebook(mockAccessToken, mockUserId);

        expect(result).toEqual({
            email: 'fb@example.com',
            first_name: 'John',
            last_name: '',
            auth: AuthProviderEnum.META,
            picture: 'http://fb.com/photo.jpg',
        });
    });

    it('should handle multiple middle names correctly', async () => {
        (axios.get as jest.Mock).mockResolvedValue({
            data: {
                email: 'fb@example.com',
                name: 'John Michael Doe',
                picture: { data: { url: 'http://fb.com/photo.jpg' } },
            },
        });

        const result = await authorizeFacebook(mockAccessToken, mockUserId);

        expect(result).toEqual({
            email: 'fb@example.com',
            first_name: 'John',
            last_name: 'Michael Doe',
            auth: AuthProviderEnum.META,
            picture: 'http://fb.com/photo.jpg',
        });
    });

    it('should handle missing picture field', async () => {
        (axios.get as jest.Mock).mockResolvedValue({
            data: {
                email: 'fb@example.com',
                name: 'John Doe',
                picture: undefined,
            },
        });

        const result = await authorizeFacebook(mockAccessToken, mockUserId);

        expect(result).toEqual({
            email: 'fb@example.com',
            first_name: 'John',
            last_name: 'Doe',
            auth: AuthProviderEnum.META,
            picture: undefined,
        });
    });

    it('should throw and log error on failure', async () => {
        const error = new Error('Facebook API failed');
        (axios.get as jest.Mock).mockRejectedValue(error);

        await expect(
            authorizeFacebook(mockAccessToken, mockUserId),
        ).rejects.toThrow('Facebook API failed');

        expect(logger.error).toHaveBeenCalledWith('Facebook API failed');
    });
});
