import { jest } from '@jest/globals';

// Global test setup
beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Reset environment variables
    process.env.NODE_ENV = 'test';
    process.env.AUTH_SERVICE_PORT = '50052';

    // JWT configuration
    process.env.ACCESS_JWT_TOKEN = 'test-access-token-secret';
    process.env.ACCESS_JWT_EXPIRE = '15m';
    process.env.REFRESH_TOKEN = 'test-refresh-token-secret';
    process.env.REFRESH_TOKEN_EXPIRE = '7d';
    process.env.VERIFY_JWT_TOKEN = 'test-verify-token-secret';
    process.env.VERIFY_JWT_EXPIRE = '24h';
    process.env.RESET_JWT_TOKEN = 'test-reset-token-secret';
    process.env.RESET_JWT_EXPIRE = '1h';

    // OAuth configuration
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

    // Service configuration
    process.env.USER_SERVICE_HOST = 'localhost';
    process.env.USER_SERVICE_PORT = '50053';
    process.env.NOTIFICATION_SERVICE_HOST = 'localhost';
    process.env.NOTIFICATION_SERVICE_PORT = '50057';
});

afterEach(() => {
    // Cleanup after each test
    jest.restoreAllMocks();
});
