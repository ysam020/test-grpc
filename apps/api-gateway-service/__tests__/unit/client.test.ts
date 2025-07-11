// apps/api-gateway-service/__tests__/unit/client.test.ts
import { credentials } from '@grpc/grpc-js';

// Mock grpc-config
jest.mock('@atc/grpc-config', () => ({
    serviceDefinitions: {
        authPackageDefinition: {
            auth: {
                AuthService: jest.fn(),
            },
        },
        userPackageDefinition: {
            user: {
                UserService: jest.fn(),
            },
        },
        productPackageDefinition: {
            product: {
                ProductService: jest.fn(),
            },
        },
    },
}));

// Mock grpc credentials
jest.mock('@grpc/grpc-js', () => ({
    credentials: {
        createInsecure: jest.fn().mockReturnValue('mock-credentials'),
    },
}));

// Mock environment variables
const originalEnv = process.env;
beforeAll(() => {
    process.env = {
        ...originalEnv,
        AUTH_SERVICE_HOST: 'localhost',
        AUTH_SERVICE_PORT: '50052',
        USER_SERVICE_HOST: 'localhost',
        USER_SERVICE_PORT: '50053',
        PRODUCT_SERVICE_HOST: 'localhost',
        PRODUCT_SERVICE_PORT: '50054',
    };
});

afterAll(() => {
    process.env = originalEnv;
});

describe('gRPC Client Setup Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create gRPC clients with correct configuration', async () => {
        // Import after mocking to ensure mocks are applied
        const { serviceDefinitions } = await import('@atc/grpc-config');

        // Import the client module to trigger client creation
        await import('../../../src/client');

        expect(
            serviceDefinitions.authPackageDefinition.auth.AuthService,
        ).toHaveBeenCalledWith('localhost:50052', 'mock-credentials');

        expect(
            serviceDefinitions.userPackageDefinition.user.UserService,
        ).toHaveBeenCalledWith('localhost:50053', 'mock-credentials');

        expect(credentials.createInsecure).toHaveBeenCalled();
    });
});
