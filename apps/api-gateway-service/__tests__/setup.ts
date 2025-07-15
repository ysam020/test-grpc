// ============================================
// Test Configuration and Setup
// ============================================

// apps/api-gateway-service/__tests__/setup.ts
import { jest } from '@jest/globals';

// Global test setup
beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Reset environment variables
    process.env.NODE_ENV = 'test';
    process.env.API_GATEWAY_SERVICE_PORT = '50060';

    // Default service configuration
    process.env.AUTH_SERVICE_HOST = 'localhost';
    process.env.AUTH_SERVICE_PORT = '50052';
    process.env.USER_SERVICE_HOST = 'localhost';
    process.env.USER_SERVICE_PORT = '50053';
    process.env.PRODUCT_SERVICE_HOST = 'localhost';
    process.env.PRODUCT_SERVICE_PORT = '50054';
    process.env.WIDGET_SERVICE_HOST = 'localhost';
    process.env.WIDGET_SERVICE_PORT = '50055';
    process.env.SURVEY_SERVICE_HOST = 'localhost';
    process.env.SURVEY_SERVICE_PORT = '50056';
    process.env.NOTIFICATION_SERVICE_HOST = 'localhost';
    process.env.NOTIFICATION_SERVICE_PORT = '50057';
    process.env.SAMPLE_SERVICE_HOST = 'localhost';
    process.env.SAMPLE_SERVICE_PORT = '50058';
    process.env.CATALOGUE_SERVICE_HOST = 'localhost';
    process.env.CATALOGUE_SERVICE_PORT = '50059';
});

afterEach(() => {
    // Cleanup after each test
    jest.restoreAllMocks();
});
