// apps/notification-management-service/__tests__/__mocks__/grpc.ts
export const mockGrpcCall = {
    request: {},
    metadata: {
        get: jest.fn(),
    },
};

export const mockCallback = jest.fn();

export const createMockCall = (request: any, metadata?: any) => ({
    request,
    metadata: {
        get: jest.fn().mockReturnValue(metadata ? [metadata] : []),
        ...metadata,
    },
});

// apps/notification-management-service/__tests__/__mocks__/prisma.ts
export const mockPrismaClient = {
    adminNotification: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    priceAlert:: 'ts-jest',
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/server.ts',
        '!src/index.ts'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    moduleNameMapping: {
        '^@/(.*)
        error: jest.fn(),
    },
}));

const { utilFns, eventBridge } = require('@atc/common');




















