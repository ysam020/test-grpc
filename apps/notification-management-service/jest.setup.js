// Test environment setup for Notification Management gRPC service
process.env.NODE_ENV = 'test';
process.env.GRPC_PORT = '50057';
process.env.NOTIFICATION_SERVICE_PORT = '50057';
process.env.NOTIFICATION_SERVICE_HOST = 'localhost';

// External service configuration
process.env.USER_SERVICE_HOST = 'localhost';
process.env.USER_SERVICE_PORT = '50053';
process.env.PRODUCT_SERVICE_HOST = 'localhost';
process.env.PRODUCT_SERVICE_PORT = '50054';

// AWS configuration
process.env.AWS_REGION = 'us-east-1';
process.env.SNS_REGION = 'us-east-1';
process.env.EMAIL_REGION = 'us-east-1';
process.env.EMAIL_FROM = 'test@example.com';
process.env.ADMIN_NOTIFICATION_ARN =
    'arn:aws:lambda:us-east-1:123456789012:function:test-admin-notification';

// Mock database connections
global.mockDatabase = {
    adminNotification: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    notification: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    priceAlert: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
    },
    product: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
    },
};

// Mock external services
global.mockServices = {
    emailService: {
        sendEmail: jest.fn(),
        sendBulkEmail: jest.fn(),
        createTemplate: jest.fn(),
        deleteTemplate: jest.fn(),
    },
    snsService: {
        publishMessage: jest.fn(),
        createTopic: jest.fn(),
        deleteTopic: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
    },
    eventBridgeService: {
        createEventBridgeSchedule: jest.fn(),
        deleteEventBridgeSchedule: jest.fn(),
        updateEventBridgeSchedule: jest.fn(),
        getEventBridgeSchedule: jest.fn(),
    },
    userStub: {
        GetUser: jest.fn(),
        GetUsers: jest.fn(),
        ValidateUser: jest.fn(),
        GetUsersByRole: jest.fn(),
        GetUserPreferences: jest.fn(),
    },
    productStub: {
        GetProduct: jest.fn(),
        GetProducts: jest.fn(),
        GetProductPrice: jest.fn(),
        UpdateProductPrice: jest.fn(),
    },
};

// gRPC test utilities
global.grpcTestUtils = {
    createMockCall: (metadata = {}, request = {}) => ({
        metadata: new Map(Object.entries(metadata)),
        getPeer: jest.fn().mockReturnValue('127.0.0.1:12345'),
        cancelled: false,
        request: request,
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
    createMockServerUnaryCall: (request = {}, metadata = {}) => ({
        request,
        metadata: new Map(Object.entries(metadata)),
        getPeer: jest.fn().mockReturnValue('127.0.0.1:12345'),
        cancelled: false,
        call: jest.fn(),
    }),
};

// Reset all mocks before each test
beforeEach(() => {
    // Clear database mocks
    Object.values(global.mockDatabase).forEach((model) => {
        Object.values(model).forEach((method) => {
            if (jest.isMockFunction(method)) {
                method.mockClear();
            }
        });
    });

    // Clear service mocks
    Object.values(global.mockServices).forEach((service) => {
        Object.values(service).forEach((method) => {
            if (jest.isMockFunction(method)) {
                method.mockClear();
            }
        });
    });

    // Reset environment variables
    process.env.NODE_ENV = 'test';
    process.env.NOTIFICATION_SERVICE_PORT = '50057';
});

afterAll(() => {
    jest.clearAllMocks();
});
Database = {
    adminNotification: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    notification: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    priceAlert: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
    },
    product: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
    },
};

// gRPC test utilities
global.grpcTestUtils = {
    createMockCall: (metadata = {}, request = {}) => ({
        metadata: new Map(Object.entries(metadata)),
        getPeer: jest.fn().mockReturnValue('127.0.0.1:12345'),
        cancelled: false,
        request: request,
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
    createMockServerUnaryCall: (request = {}, metadata = {}) => ({
        request,
        metadata: new Map(Object.entries(metadata)),
        getPeer: jest.fn().mockReturnValue('127.0.0.1:12345'),
        cancelled: false,
        call: jest.fn(),
    }),
};

// Reset all mocks before each test
beforeEach(() => {
    // Clear database mocks
    Object.values(global.mockDatabase).forEach((model) => {
        Object.values(model).forEach((method) => {
            if (jest.isMockFunction(method)) {
                method.mockClear();
            }
        });
    });

    // Reset environment variables
    process.env.NODE_ENV = 'test';
    process.env.NOTIFICATION_SERVICE_PORT = '50057';
});

afterAll(() => {
    jest.clearAllMocks();
});
