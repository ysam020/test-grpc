import { jest } from '@jest/globals';

// Global test setup
beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Reset environment variables
    process.env.NODE_ENV = 'test';
    process.env.NOTIFICATION_SERVICE_PORT = '50057';

    // Service configuration
    process.env.NOTIFICATION_SERVICE_HOST = 'localhost';
    process.env.USER_SERVICE_HOST = 'localhost';
    process.env.USER_SERVICE_PORT = '50053';
    process.env.PRODUCT_SERVICE_HOST = 'localhost';
    process.env.PRODUCT_SERVICE_PORT = '50054';

    // Event Bridge configuration
    process.env.ADMIN_NOTIFICATION_ARN =
        'arn:aws:lambda:us-east-1:123456789012:function:test-admin-notification';
    process.env.AWS_REGION = 'us-east-1';

    // SNS configuration
    process.env.SNS_REGION = 'us-east-1';

    // Email configuration
    process.env.EMAIL_FROM = 'test@example.com';
    process.env.EMAIL_REGION = 'us-east-1';
});

afterEach(() => {
    // Cleanup after each test
    jest.restoreAllMocks();
});
