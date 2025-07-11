// apps/auth-management-service/__mocks__/@grpc/grpc-js.js
const grpc = jest.createMockFromModule('@grpc/grpc-js');

// Mock gRPC status codes
grpc.status = {
    OK: 0,
    CANCELLED: 1,
    UNKNOWN: 2,
    INVALID_ARGUMENT: 3,
    DEADLINE_EXCEEDED: 4,
    NOT_FOUND: 5,
    ALREADY_EXISTS: 6,
    PERMISSION_DENIED: 7,
    RESOURCE_EXHAUSTED: 8,
    FAILED_PRECONDITION: 9,
    ABORTED: 10,
    OUT_OF_RANGE: 11,
    UNIMPLEMENTED: 12,
    INTERNAL: 13,
    UNAVAILABLE: 14,
    DATA_LOSS: 15,
    UNAUTHENTICATED: 16,
};

// Mock credentials
grpc.credentials = {
    createInsecure: jest.fn().mockReturnValue({}),
    createSsl: jest.fn().mockReturnValue({}),
    combineChannelCredentials: jest.fn().mockReturnValue({}),
    combineCallCredentials: jest.fn().mockReturnValue({}),
};

// Mock Metadata
grpc.Metadata = jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    get: jest.fn().mockReturnValue([]),
    getMap: jest.fn().mockReturnValue({}),
    clone: jest.fn().mockReturnThis(),
}));

// Mock Server
grpc.Server = jest.fn().mockImplementation(() => ({
    addService: jest.fn(),
    bindAsync: jest.fn((port, credentials, callback) => {
        process.nextTick(() => callback(null, port));
    }),
    start: jest.fn(),
    tryShutdown: jest.fn((callback) => {
        process.nextTick(callback);
    }),
    forceShutdown: jest.fn(),
}));

// Mock loadPackageDefinition
grpc.loadPackageDefinition = jest.fn().mockReturnValue({});

// Mock makeGenericClientConstructor
grpc.makeGenericClientConstructor = jest.fn().mockReturnValue(
    jest.fn().mockImplementation(() => ({
        close: jest.fn(),
        getChannel: jest.fn(),
    })),
);

// Mock interceptors
grpc.InterceptorConfigurationError = class extends Error {};

grpc.ListenerBuilder = jest.fn().mockImplementation(() => ({
    withInterceptor: jest.fn().mockReturnThis(),
}));

grpc.RequesterBuilder = jest.fn().mockImplementation(() => ({
    withInterceptor: jest.fn().mockReturnThis(),
}));

// Export the mock
module.exports = grpc;
