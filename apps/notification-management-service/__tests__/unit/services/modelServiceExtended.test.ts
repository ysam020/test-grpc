// Mock dependencies
jest.mock('@atc/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));

jest.mock('@atc/db', () => ({
    prismaClient: {
        notification: {
            findMany: jest.fn(),
            create: jest.fn(),
        },
        masterProduct: {
            findMany: jest.fn(),
        },
    },
}));

describe('Model Service Extended', () => {
    it('should be a placeholder test', () => {
        expect(true).toBe(true);
    });
});
