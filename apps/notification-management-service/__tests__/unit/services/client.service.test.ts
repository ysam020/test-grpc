// apps/notification-management-service/__tests__/unit/services/client.service.test.ts
import { createStubs } from '../../../src/services/client.service';

jest.mock('@atc/grpc-config', () => ({
    clientConfig: {
        userManagementService: {
            host: 'localhost',
            port: 3001,
        },
        productManagementService: {
            host: 'localhost',
            port: 3002,
        },
    },
    serviceDefinitions: {
        userPackageDefinition: {
            user: {
                UserService: {
                    service: 'mockUserService',
                },
            },
        },
        productPackageDefinition: {
            product: {
                ProductService: {
                    service: 'mockProductService',
                },
            },
        },
    },
}));

jest.mock('@grpc/grpc-js', () => ({
    credentials: {
        createInsecure: jest.fn().mockReturnValue('mockCredentials'),
    },
    loadPackageDefinition: jest.fn(),
    Client: jest.fn().mockImplementation(() => ({
        close: jest.fn(),
    })),
}));

describe('Client Service', () => {
    it('should create stubs successfully', () => {
        const stubs = createStubs();

        expect(stubs).toBeDefined();
        expect(typeof stubs).toBe('object');
    });
});
