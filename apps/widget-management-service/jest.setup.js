// Auto-generated Jest setup file

// Global test setup
beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Reset environment variables
    process.env.NODE_ENV = 'test';
    process.env.WIDGET_MANAGEMENT_SERVICE_PORT = '50055';

    // Database configuration
    process.env.DATABASE_URL = 'test-database-url';

    // Service configuration
    process.env.SAMPLE_SERVICE_HOST = 'localhost';
    process.env.SAMPLE_SERVICE_PORT = '50058';
    process.env.SURVEY_SERVICE_HOST = 'localhost';
    process.env.SURVEY_SERVICE_PORT = '50056';

    // Other configuration
    process.env.PUBLISH_WIDGET_ARN = 'test-publish-widget-arn';
});

afterEach(() => {
    // Cleanup after each test
    jest.restoreAllMocks();
});

// Mock @grpc/grpc-js for gRPC services
jest.mock('@grpc/grpc-js', () => ({
    credentials: {
        createInsecure: jest.fn(),
        createSsl: jest.fn(),
    },
    status: {
        OK: 0,
        CANCELLED: 1,
        UNKNOWN: 2,
        INVALID_ARGUMENT: 3,
        DEADLINE_EXCEEDED: 4,
        NOT_FOUND: 5,
        ALREADY_EXISTS: 6,
        PERMISSION_DENIED: 7,
        UNAUTHENTICATED: 16,
        RESOURCE_EXHAUSTED: 8,
        FAILED_PRECONDITION: 9,
        ABORTED: 10,
        OUT_OF_RANGE: 11,
        UNIMPLEMENTED: 12,
        INTERNAL: 13,
        UNAVAILABLE: 14,
        DATA_LOSS: 15,
    },
    Metadata: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        clone: jest.fn(),
    })),
    loadPackageDefinition: jest.fn(),
    loadSync: jest.fn(),
}));

// Increase timeout for integration tests
jest.setTimeout(30000);

// Console error suppression for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
    console.error = (...args) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Warning:') || 
             args[0].includes('Deprecated:') ||
             args[0].includes('ReactDOM.render is deprecated'))
        ) {
            return;
        }
        originalConsoleError.call(console, ...args);
    };
    
    console.warn = (...args) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('Warning:')
        ) {
            return;
        }
        originalConsoleWarn.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
});

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
