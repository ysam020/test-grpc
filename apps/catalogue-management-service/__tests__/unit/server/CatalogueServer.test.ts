// Mock everything BEFORE any imports to ensure proper setup
jest.mock('@atc/grpc-server', () => {
    // Create a proper class mock that can be extended
    class MockBaseGrpcServer {
        addMiddleware = jest.fn();
        addService = jest.fn();
        wrapWithValidation = jest.fn((handler, schema) => handler);
        start = jest.fn().mockResolvedValue(undefined);
        stop = jest.fn().mockResolvedValue(undefined);
        getServer = jest.fn();

        constructor() {
            // Ensure methods are bound to the instance
            this.addMiddleware = jest.fn();
            this.addService = jest.fn();
            this.wrapWithValidation = jest.fn((handler, schema) => handler);
            this.start = jest.fn().mockResolvedValue(undefined);
            this.stop = jest.fn().mockResolvedValue(undefined);
            this.getServer = jest.fn();
        }
    }

    return {
        BaseGrpcServer: MockBaseGrpcServer,
        authMiddleware: jest.fn(() => jest.fn()),
        roleMiddleware: jest.fn(() => jest.fn()),
    };
});

jest.mock('@atc/grpc-config', () => ({
    serviceDefinitions: {
        cataloguePackageDefinition: {
            catalogue: {
                CatalogueService: {
                    service: {},
                },
            },
        },
        healthPackageDefinition: {
            health: {
                HealthService: {
                    service: {},
                },
            },
        },
    },
}));

jest.mock('@atc/common', () => ({
    healthCheck: jest.fn(),
    catalogueValidation: {},
    UserRoleEnum: {
        ADMIN: 'ADMIN',
        USER: 'USER',
    },
}));

jest.mock('../../../src/handlers', () => ({
    handlers: {},
}));

jest.mock('../../../src/validations', () => ({
    attachProductsToGroupSchema: {},
    createAdvertisementSchema: {},
    exportToExcelAdvertisementsSchema: {},
    exportToExcelSchema: {},
    getAdvertisementsSchema: {},
    getAllProductGroupsSchema: {},
    getAttachedProductsSchema: {},
    getSingleAdvertisementSchema: {},
    matchAdvertisementItemSchema: {},
    productGroupIDSchema: {},
    removeProductsFromGroupSchema: {},
    updateAdvertisementSchema: {},
    updateProductGroupSchema: {},
}));

// Import AFTER all mocks are set up
import { CatalogueServer } from '../../../src/index';

describe('CatalogueServer', () => {
    it('should create CatalogueServer instance successfully', () => {
        expect(() => {
            new CatalogueServer();
        }).not.toThrow();
    });

    it('should initialize server without errors', () => {
        const catalogueServer = new CatalogueServer();
        expect(catalogueServer).toBeDefined();
        expect(catalogueServer).toBeInstanceOf(CatalogueServer);
    });

    it('should have proper inheritance from BaseGrpcServer', () => {
        const catalogueServer = new CatalogueServer();
        expect(catalogueServer.addMiddleware).toBeDefined();
        expect(catalogueServer.addService).toBeDefined();
        expect(catalogueServer.wrapWithValidation).toBeDefined();
    });
});