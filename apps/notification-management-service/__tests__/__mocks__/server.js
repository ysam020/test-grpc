// apps/notification-management-service/__tests__/__mocks__/server.js
module.exports = {
    NotificationServer: jest.fn().mockImplementation(() => ({
        initializeServer: jest.fn(),
        addMiddleware: jest.fn(),
        addService: jest.fn(),
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockResolvedValue(undefined),
        wrapWithValidation: jest.fn(),
        getServer: jest.fn(),
        bindService: jest.fn(),
        getPort: jest.fn().mockReturnValue(50057),
        getHost: jest.fn().mockReturnValue('localhost'),
        isRunning: jest.fn().mockReturnValue(false),
    })),

    createServer: jest.fn(),
    startServer: jest.fn(),
    stopServer: jest.fn(),
};
