module.exports = {
    displayName: 'API Gateway Service',
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
    ],
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        '^@atc/(.*)$': '<rootDir>/../../packages/$1/src',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: {
                    isolatedModules: true,
                    module: 'CommonJS',
                    target: 'ES2020',
                },
                useESM: false,
            },
        ],
    },
    testTimeout: 30000,
    clearMocks: true,
    restoreMocks: true,
    transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],
};
