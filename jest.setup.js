// jest.setup.js - Root level
// Global test setup and configuration

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'test-database-url';

// Mock gRPC services for testing
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
    },
    Metadata: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
    })),
}));

// Increase timeout for integration tests
jest.setTimeout(30000);

// Console error suppression for cleaner test output
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render is deprecated')
        ) {
            return;
        }
        originalConsoleError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalConsoleError;
});
