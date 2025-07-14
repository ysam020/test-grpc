import 'jest';

// Setup test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.JWT_SECRET = 'test-secret';
process.env.PROTO_PATH = '/mock/proto/path';

// Set all service hosts and ports for testing
process.env.AUTH_SERVICE_HOST = 'localhost';
process.env.AUTH_SERVICE_PORT = '50052';
process.env.USER_SERVICE_HOST = 'localhost';
process.env.USER_SERVICE_PORT = '50053';
process.env.PRODUCT_SERVICE_HOST = 'localhost';
process.env.PRODUCT_SERVICE_PORT = '50054';
process.env.WIDGET_SERVICE_HOST = 'localhost';
process.env.WIDGET_SERVICE_PORT = '50056';
process.env.SURVEY_SERVICE_HOST = 'localhost';
process.env.SURVEY_SERVICE_PORT = '50057';
process.env.NOTIFICATION_SERVICE_HOST = 'localhost';
process.env.NOTIFICATION_SERVICE_PORT = '50058';
process.env.SAMPLE_SERVICE_HOST = 'localhost';
process.env.SAMPLE_SERVICE_PORT = '50059';
process.env.CATALOGUE_SERVICE_HOST = 'localhost';
process.env.CATALOGUE_SERVICE_PORT = '50060';

// Mock @grpc/grpc-js globally
jest.mock('@grpc/grpc-js', () => ({
    credentials: {
        createInsecure: jest.fn(),
    },
}));

// Global beforeEach for all tests
beforeEach(() => {
    jest.clearAllMocks();
});

// Global afterEach for all tests
afterEach(() => {
    jest.restoreAllMocks();
});
