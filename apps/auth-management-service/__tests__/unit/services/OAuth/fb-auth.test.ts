import axios from 'axios';

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
    AuthProviderEnum: {
        META: 'meta',
    },
    utilFns: {
        splitName: jest.fn(),
    },
}));

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

import { authorizeFacebook } from '../../../../src/services/OAuth/fb-auth';

const { utilFns } = require('@atc/common');

describe('Facebook Auth Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('successful authentication', () => {
        it('should authorize Facebook user successfully', async () => {
            const mockFacebookResponse = {
                data: {
                    email: 'test@example.com',
                    name: 'John Doe',
                    picture: {
                        data: {
                            url: 'https://graph.facebook.com/avatar.jpg',
                        },
                    },
                },
            };

            mockedAxios.get.mockResolvedValue(mockFacebookResponse);
            utilFns.splitName.mockReturnValue({
                first_name: 'John',
                last_name: 'Doe',
            });

            const result = await authorizeFacebook('access-token', 'user-id');

            expect(mockedAxios.get).toHaveBeenCalledWith(
                'https://graph.facebook.com/v2.11/user-id?fields=id,name,email,picture&access_token=access-token'
            );

            expect(utilFns.splitName).toHaveBeenCalledWith('John Doe');

            expect(result).toEqual({
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Doe',
                auth: 'meta',
                picture: 'https://graph.facebook.com/avatar.jpg',
            });
        });

        it('should handle user with middle names', async () => {
            const mockFacebookResponse = {
                data: {
                    email: 'test@example.com',
                    name: 'John Michael Smith',
                    picture: {
                        data: {
                            url: 'https://graph.facebook.com/avatar.jpg',
                        },
                    },
                },
            };

            mockedAxios.get.mockResolvedValue(mockFacebookResponse);
            utilFns.splitName.mockReturnValue({
                first_name: 'John',
                last_name: 'Michael Smith',
            });

            const result = await authorizeFacebook('access-token', 'user-id');

            expect(result).toEqual({
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Michael Smith',
                auth: 'meta',
                picture: 'https://graph.facebook.com/avatar.jpg',
            });
        });
    });

    describe('error handling', () => {
        it('should handle missing picture field', async () => {
            const mockFacebookResponse = {
                data: {
                    email: 'test@example.com',
                    name: 'John Doe',
                    picture: undefined, // Missing picture
                },
            };

            mockedAxios.get.mockResolvedValue(mockFacebookResponse);
            utilFns.splitName.mockReturnValue({
                first_name: 'John',
                last_name: 'Doe',
            });

            // This should throw an error because picture.data.url will fail
            await expect(authorizeFacebook('access-token', 'user-id')).rejects.toThrow();

            const { logger } = require('@atc/logger');
            expect(logger.error).toHaveBeenCalled();
        });

        it('should handle missing picture.data field', async () => {
            const mockFacebookResponse = {
                data: {
                    email: 'test@example.com',
                    name: 'John Doe',
                    picture: {
                        // Missing data property
                    },
                },
            };

            mockedAxios.get.mockResolvedValue(mockFacebookResponse);
            utilFns.splitName.mockReturnValue({
                first_name: 'John',
                last_name: 'Doe',
            });

            // This should throw an error because picture.data.url will fail
            await expect(authorizeFacebook('access-token', 'user-id')).rejects.toThrow();

            const { logger } = require('@atc/logger');
            expect(logger.error).toHaveBeenCalled();
        });

        it('should handle Facebook API errors', async () => {
            const apiError = new Error('Facebook API error');
            mockedAxios.get.mockRejectedValue(apiError);

            await expect(authorizeFacebook('access-token', 'user-id')).rejects.toThrow('Facebook API error');

            const { logger } = require('@atc/logger');
            expect(logger.error).toHaveBeenCalledWith('Facebook API error');
        });

        it('should handle invalid access token', async () => {
            const authError = new Error('Invalid OAuth access token');
            mockedAxios.get.mockRejectedValue(authError);

            await expect(authorizeFacebook('invalid-token', 'user-id')).rejects.toThrow('Invalid OAuth access token');
        });

        it('should handle network errors', async () => {
            const networkError = new Error('Network Error');
            mockedAxios.get.mockRejectedValue(networkError);

            await expect(authorizeFacebook('access-token', 'user-id')).rejects.toThrow('Network Error');
        });

        it('should handle missing email in response', async () => {
            const mockFacebookResponse = {
                data: {
                    name: 'John Doe',
                    picture: {
                        data: {
                            url: 'https://graph.facebook.com/avatar.jpg',
                        },
                    },
                    // Missing email
                },
            };

            mockedAxios.get.mockResolvedValue(mockFacebookResponse);
            utilFns.splitName.mockReturnValue({
                first_name: 'John',
                last_name: 'Doe',
            });

            const result = await authorizeFacebook('access-token', 'user-id');

            expect(result).toEqual({
                email: undefined, // Will be undefined but with ! assertion
                first_name: 'John',
                last_name: 'Doe',
                auth: 'meta',
                picture: 'https://graph.facebook.com/avatar.jpg',
            });
        });

        it('should handle missing name in response', async () => {
            const mockFacebookResponse = {
                data: {
                    email: 'test@example.com',
                    picture: {
                        data: {
                            url: 'https://graph.facebook.com/avatar.jpg',
                        },
                    },
                    // Missing name
                },
            };

            mockedAxios.get.mockResolvedValue(mockFacebookResponse);
            utilFns.splitName.mockReturnValue({
                first_name: '',
                last_name: '',
            });

            const result = await authorizeFacebook('access-token', 'user-id');

            expect(utilFns.splitName).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({
                email: 'test@example.com',
                first_name: '',
                last_name: '',
                auth: 'meta',
                picture: 'https://graph.facebook.com/avatar.jpg',
            });
        });
    });

    describe('URL construction', () => {
        it('should construct correct Facebook Graph API URL', async () => {
            const mockFacebookResponse = {
                data: {
                    email: 'test@example.com',
                    name: 'John Doe',
                    picture: {
                        data: {
                            url: 'https://graph.facebook.com/avatar.jpg',
                        },
                    },
                },
            };

            mockedAxios.get.mockResolvedValue(mockFacebookResponse);
            utilFns.splitName.mockReturnValue({
                first_name: 'John',
                last_name: 'Doe',
            });

            await authorizeFacebook('test-access-token', 'test-user-id');

            expect(mockedAxios.get).toHaveBeenCalledWith(
                'https://graph.facebook.com/v2.11/test-user-id?fields=id,name,email,picture&access_token=test-access-token'
            );
        });

        it('should handle special characters in parameters', async () => {
            const mockFacebookResponse = {
                data: {
                    email: 'test@example.com',
                    name: 'John Doe',
                    picture: {
                        data: {
                            url: 'https://graph.facebook.com/avatar.jpg',
                        },
                    },
                },
            };

            mockedAxios.get.mockResolvedValue(mockFacebookResponse);
            utilFns.splitName.mockReturnValue({
                first_name: 'John',
                last_name: 'Doe',
            });

            await authorizeFacebook('token-with-special&chars', 'user&id');

            expect(mockedAxios.get).toHaveBeenCalledWith(
                'https://graph.facebook.com/v2.11/user&id?fields=id,name,email,picture&access_token=token-with-special&chars'
            );
        });
    });
});