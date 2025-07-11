// apps/auth-management-service/jest.config.js
module.exports = {
    displayName: 'Auth Management Service (gRPC)',
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: '.',
    testMatch: [
        '<rootDir>/__tests__/**/*.test.{ts,js}',
        '<rootDir>/src/**/*.test.{ts,js}',
    ],
    collectCoverageFrom: [
        'src/**/*.{ts,js}',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
        '!src/**/*.interface.ts',
        '!src/**/*.type.ts',
        '!src/**/generated/**',
    ],
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        '^@atc/(.*)$': '<rootDir>/../../packages/$1/src',
        '^@/(.*)$': '<rootDir>/src/$1',
        '@grpc/grpc-js': '<rootDir>/__mocks__/@grpc/grpc-js.js',
    },
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: {
                    isolatedModules: true,
                },
            },
        ],
    },
    testTimeout: 30000,
    clearMocks: true,
    restoreMocks: true,
};
