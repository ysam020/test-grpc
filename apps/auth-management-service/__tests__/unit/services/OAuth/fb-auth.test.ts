import { jest } from '@jest/globals';
import { authorizeFacebook } from '../../../../src/services/OAuth/fb-auth';
import { AuthProviderEnum } from '@atc/common';

// Mock dependencies
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
        META: 'meta',
        APPLE: 'apple',
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

const axios = require('axios');
const { logger } = require('@atc/logger');

describe('Facebook Auth Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockToken = 'mock-facebook-token';
    const mockUserID = 'mock-user-id';
    const baseUser = {
        email: 'fb@example.com',
    };

    it('should return user info from Facebook API', async () => {
        axios.get.mockResolvedValue({
            data: {
                ...baseUser,
                name: 'John Doe',
                picture: { data: { url: 'http://fb.com/photo.jpg' } },
            },
        });

        const result = await authorizeFacebook(mockToken, mockUserID);

        expect(result).toEqual({
            email: 'fb@example.com',
            first_name: 'John',
            last_name: 'Doe',
            auth: AuthProviderEnum.META,
            picture: 'http://fb.com/photo.jpg',
        });
    });

    it('should handle single-word names correctly', async () => {
        axios.get.mockResolvedValue({
            data: {
                ...baseUser,
                name: 'John',
                picture: { data: { url: 'http://fb.com/photo.jpg' } },
            },
        });

        const result = await authorizeFacebook(mockToken, mockUserID);

        expect(result).toEqual({
            email: 'fb@example.com',
            first_name: 'John',
            last_name: '',
            auth: AuthProviderEnum.META,
            picture: 'http://fb.com/photo.jpg',
        });
    });

    it('should handle multiple middle names correctly', async () => {
        axios.get.mockResolvedValue({
            data: {
                ...baseUser,
                name: 'John Michael Smith Doe',
                picture: { data: { url: 'http://fb.com/photo.jpg' } },
            },
        });

        const result = await authorizeFacebook(mockToken, mockUserID);

        expect(result).toEqual({
            email: 'fb@example.com',
            first_name: 'John',
            last_name: 'Michael Smith Doe',
            auth: AuthProviderEnum.META,
            picture: 'http://fb.com/photo.jpg',
        });
    });

    it('should handle missing picture field', async () => {
        axios.get.mockResolvedValue({
            data: {
                ...baseUser,
                name: 'John Doe',
                picture: undefined,
            },
        });

        const result = await authorizeFacebook(mockToken, mockUserID);

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
        axios.get.mockRejectedValue(error);

        await expect(authorizeFacebook(mockToken, mockUserID)).rejects.toThrow(
            'Facebook API failed',
        );

        expect(logger.error).toHaveBeenCalledWith('Facebook API failed');
    });
});
