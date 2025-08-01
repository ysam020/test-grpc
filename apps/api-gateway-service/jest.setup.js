process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
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

// Mock gRPC client stubs
global.mockGrpcClients = {
    authStub: {
        authenticate: jest.fn(),
        validateToken: jest.fn(),
        refreshToken: jest.fn(),
    },
    userStub: {
        createUser: jest.fn(),
        getUserById: jest.fn(),
        updateUser: jest.fn(),
        deleteUser: jest.fn(),
    },
    productStub: {
        getAllProducts: jest.fn(),
        getProductById: jest.fn(),
        createProduct: jest.fn(),
        updateProduct: jest.fn(),
    },
    widgetStub: {
        GetActiveLayout: jest.fn(),
        createWidget: jest.fn(),
        updateWidget: jest.fn(),
    },
    surveyStub: {
        GetSingleSurvey: jest.fn(),
        DidUserAnswered: jest.fn(),
        createSurvey: jest.fn(),
    },
    sampleStub: {
        GetSampleStatus: jest.fn(),
        createSample: jest.fn(),
    },
    notificationStub: {
        sendNotification: jest.fn(),
        getNotifications: jest.fn(),
    },
    catalogueStub: {
        getCatalogue: jest.fn(),
        updateCatalogue: jest.fn(),
    },
};

// Reset all mocks before each test
beforeEach(() => {
    Object.values(global.mockGrpcClients).forEach((stub) => {
        Object.values(stub).forEach((method) => {
            if (jest.isMockFunction(method)) {
                method.mockClear();
            }
        });
    });
});

// Cleanup after all tests
afterAll(() => {
    jest.clearAllMocks();
});
