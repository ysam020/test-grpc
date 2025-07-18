/** @type {import('jest').Config} */
module.exports = {
    displayName: 'Notification Management Service',
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: '.',
    roots: ['<rootDir>/src', '<rootDir>/__tests__'],
    testMatch: [
        '<rootDir>/__tests__/**/*.test.{ts,js}',
        '<rootDir>/src/**/*.test.{ts,js}',
        '**/__tests__/**/*.test.ts',
        '**/__tests__/**/*.spec.ts',
    ],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/server.ts',
        '!src/client.ts',
    ],
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testTimeout: 30000,
    verbose: true,
    clearMocks: true,
    restoreMocks: true,
    transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],
};
