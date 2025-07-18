// apps/notification-management-service/__tests__/__mocks__/@atc/logger.js
module.exports = {
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        fatal: jest.fn(),
    },
    createLogger: jest.fn(),
};
