// apps/notification-management-service/__tests__/__mocks__/@atc/grpc-server.js
module.exports = {
    BaseGrpcServer: jest.fn().mockImplementation(() => ({
        addMiddleware: jest.fn(),
        addService: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        wrapWithValidation: jest.fn(),
        getServer: jest.fn(),
    })),
    authMiddleware: jest.fn(),
    roleMiddleware: jest.fn(),
    CustomServerUnaryCall: jest.fn(),
    CustomServerReadableStream: jest.fn(),
    CustomServerWritableStream: jest.fn(),
    CustomServerDuplexStream: jest.fn(),
};
