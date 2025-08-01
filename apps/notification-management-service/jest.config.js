module.exports = {
        displayName: 'Notification Management Service',
        preset: 'ts-jest',
        testEnvironment: 'node',
        roots: ['<rootDir>/src', '<rootDir>/__tests__'],
        testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.spec.ts'],
        collectCoverageFrom: [
            'src/**/*.ts',
            '!src/**/*.d.ts',
            '!src/**/index.ts',
            '!src/server.ts',
            '!src/client.ts',
        ],
        coverageDirectory: 'coverage',
        coverageReporters: ['text', 'lcov', 'html'],
        setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
        clearMocks: true,
        restoreMocks: true,
        resetMocks: true,
        moduleDirectories: ['node_modules', '<rootDir>/__tests__/__mocks__'],
    };
    