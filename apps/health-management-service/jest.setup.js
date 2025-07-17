// Test environment setup for Health Management gRPC service
process.env.NODE_ENV = 'test';
process.env.GRPC_PORT = '50061';
process.env.HEALTH_SERVICE_HOST = 'localhost';
process.env.HEALTH_SERVICE_PORT = '50061';

// Mock external service configurations for health checks
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

// Mock service health statuses for unit tests
global.mockServiceStatuses = {
    'auth-service': 'SERVING',
    'user-service': 'SERVING',
    'product-service': 'SERVING',
    'widget-service': 'SERVING',
    'survey-service': 'SERVING',
    'notification-service': 'SERVING',
    'sample-service': 'SERVING',
    'catalogue-service': 'SERVING',
};

// Mock gRPC client connections for health check testing
global.mockGrpcClients = {
    authClient: {
        healthCheck: jest.fn(),
        close: jest.fn(),
        waitForReady: jest.fn(),
    },
    userClient: {
        healthCheck: jest.fn(),
        close: jest.fn(),
        waitForReady: jest.fn(),
    },
    productClient: {
        healthCheck: jest.fn(),
        close: jest.fn(),
        waitForReady: jest.fn(),
    },
    widgetClient: {
        healthCheck: jest.fn(),
        close: jest.fn(),
        waitForReady: jest.fn(),
    },
    surveyClient: {
        healthCheck: jest.fn(),
        close: jest.fn(),
        waitForReady: jest.fn(),
    },
    notificationClient: {
        healthCheck: jest.fn(),
        close: jest.fn(),
        waitForReady: jest.fn(),
    },
    sampleClient: {
        healthCheck: jest.fn(),
        close: jest.fn(),
        waitForReady: jest.fn(),
    },
    catalogueClient: {
        healthCheck: jest.fn(),
        close: jest.fn(),
        waitForReady: jest.fn(),
    },
};

// Mock health check responses for different scenarios
global.mockHealthResponses = {
    allHealthy: () => [
        { serviceName: 'auth-service', status: 'SERVING' },
        { serviceName: 'user-service', status: 'SERVING' },
        { serviceName: 'product-service', status: 'SERVING' },
        { serviceName: 'widget-service', status: 'SERVING' },
        { serviceName: 'survey-service', status: 'SERVING' },
        { serviceName: 'notification-service', status: 'SERVING' },
        { serviceName: 'sample-service', status: 'SERVING' },
        { serviceName: 'catalogue-service', status: 'SERVING' },
    ],
    partialFailure: () => [
        { serviceName: 'auth-service', status: 'SERVING' },
        { serviceName: 'user-service', status: 'NOT_SERVING' },
        { serviceName: 'product-service', status: 'SERVING' },
        { serviceName: 'widget-service', status: 'NOT_SERVING' },
        { serviceName: 'survey-service', status: 'SERVING' },
        { serviceName: 'notification-service', status: 'SERVING' },
        { serviceName: 'sample-service', status: 'NOT_SERVING' },
        { serviceName: 'catalogue-service', status: 'SERVING' },
    ],
    allDown: () => [
        { serviceName: 'auth-service', status: 'NOT_SERVING' },
        { serviceName: 'user-service', status: 'NOT_SERVING' },
        { serviceName: 'product-service', status: 'NOT_SERVING' },
        { serviceName: 'widget-service', status: 'NOT_SERVING' },
        { serviceName: 'survey-service', status: 'NOT_SERVING' },
        { serviceName: 'notification-service', status: 'NOT_SERVING' },
        { serviceName: 'sample-service', status: 'NOT_SERVING' },
        { serviceName: 'catalogue-service', status: 'NOT_SERVING' },
    ],
    empty: () => [],
};

// gRPC test utilities for consistent test setup
global.grpcTestUtils = {
    createMockCall: (metadata = {}, request = {}) => ({
        metadata: new Map(Object.entries(metadata)),
        getPeer: jest.fn().mockReturnValue('127.0.0.1:12345'),
        cancelled: false,
        request,
        deadline: Date.now() + 30000, // 30 second timeout
    }),
    createMockCallback: () => {
        const callback = jest.fn();
        callback.mockImplementation((error, response) => {
            if (error) {
                throw error;
            }
            return response;
        });
        return callback;
    },
    createMockStream: () => ({
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
        emit: jest.fn(),
        cancel: jest.fn(),
    }),
};

// Mock error generators for testing error scenarios
global.mockErrors = {
    networkError: () => new Error('ECONNREFUSED: Connection refused'),
    timeoutError: () => new Error('DEADLINE_EXCEEDED: Deadline exceeded'),
    serviceUnavailable: () => new Error('UNAVAILABLE: Service unavailable'),
    authError: () => new Error('UNAUTHENTICATED: Authentication failed'),
    permissionError: () => new Error('PERMISSION_DENIED: Permission denied'),
    internalError: () => new Error('INTERNAL: Internal server error'),
};

// Health service specific test data
global.healthTestData = {
    validHealthRequest: {},
    invalidHealthRequest: null,
    serviceConfigs: {
        auth: { host: 'localhost', port: 50052 },
        user: { host: 'localhost', port: 50053 },
        product: { host: 'localhost', port: 50054 },
        widget: { host: 'localhost', port: 50055 },
        survey: { host: 'localhost', port: 50056 },
        notification: { host: 'localhost', port: 50057 },
        sample: { host: 'localhost', port: 50058 },
        catalogue: { host: 'localhost', port: 50059 },
    },
};

// Reset all mocks before each test
beforeEach(() => {
    // Clear all gRPC client mocks
    Object.values(global.mockGrpcClients).forEach((client) => {
        Object.values(client).forEach((method) => {
            if (jest.isMockFunction(method)) {
                method.mockClear();
            }
        });
    });

    // Reset service statuses to default healthy state
    global.mockServiceStatuses = {
        'auth-service': 'SERVING',
        'user-service': 'SERVING',
        'product-service': 'SERVING',
        'widget-service': 'SERVING',
        'survey-service': 'SERVING',
        'notification-service': 'SERVING',
        'sample-service': 'SERVING',
        'catalogue-service': 'SERVING',
    };

    // Clear console output for clean test logs
    jest.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
    // Restore any mocked functions
    jest.restoreAllMocks();
});

// Global cleanup after all tests
afterAll(() => {
    // Final cleanup
    jest.clearAllMocks();

    // Close any open connections
    Object.values(global.mockGrpcClients).forEach((client) => {
        if (client.close && jest.isMockFunction(client.close)) {
            client.close();
        }
    });
});
