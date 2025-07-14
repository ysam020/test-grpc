// Test environment setup for gRPC service
process.env.NODE_ENV = 'test';
process.env.GRPC_PORT = '50052';
process.env.DATABASE_URL = 'test-database-url';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '4'; // Lower rounds for faster tests

// Mock database connections
global.mockDatabase = {
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
};

// Mock external services
global.mockServices = {
    emailService: {
        sendVerificationEmail: jest.fn(),
        sendPasswordResetEmail: jest.fn(),
    },
    redisService: {
        set: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
    },
};

// gRPC test utilities
global.grpcTestUtils = {
    createMockCall: (metadata = {}) => ({
        metadata: new Map(Object.entries(metadata)),
        getPeer: jest.fn().mockReturnValue('127.0.0.1:12345'),
        cancelled: false,
        request: {},
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
};

// Reset all mocks before each test
beforeEach(() => {
    Object.values(global.mockDatabase).forEach((model) => {
        Object.values(model).forEach((method) => {
            if (jest.isMockFunction(method)) {
                method.mockClear();
            }
        });
    });

    Object.values(global.mockServices).forEach((service) => {
        Object.values(service).forEach((method) => {
            if (jest.isMockFunction(method)) {
                method.mockClear();
            }
        });
    });
});

afterAll(() => {
    jest.clearAllMocks();
});
