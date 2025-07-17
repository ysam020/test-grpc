module.exports = {
    displayName: 'Health Management Service',
    testEnvironment: 'node',
    rootDir: '.',
    preset: 'ts-jest',
    testMatch: [
        '<rootDir>/__tests__/**/*.test.{ts,js}',
        '<rootDir>/src/**/*.test.{ts,js}',
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
    clearMocks: true,
    restoreMocks: true,
    transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],
};
