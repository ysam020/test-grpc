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
        userPackageDefinition: {
            user: {
                UserService: {
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
    userValidation: {},
    UserRoleEnum: {
        ADMIN: 'ADMIN',
        USER: 'USER',
        MODERATOR: 'MODERATOR',
    },
    utilFns: {
        phoneRegNdFormatByCountry: jest.fn().mockReturnValue({ format: 'test-format' }),
    },
    errorMessage: {
        USER: {
            PHONE_FORMAT: jest.fn().mockReturnValue('Invalid phone format'),
        },
    },
}));

jest.mock('../../../src/handlers', () => ({
    handlers: {},
}));

jest.mock('../../../src/validations', () => ({
    acceptDeviceTokenSchema: {},
    addToBasketSchema: {},
    changePasswordSchema: {},
    pageAndLimitSchema: {},
    removeFromBasketSchema: {},
    updateUserSchema: {},
    UUIDSchema: {},
    viewBasketSchema: {},
}));

// Import AFTER all mocks are set up
import { UserServer } from '../../../src/index';

describe('UserServer', () => {
    it('should create UserServer instance successfully', () => {
        expect(() => {
            new UserServer();
        }).not.toThrow();
    });

    it('should initialize server without errors', () => {
        const userServer = new UserServer();
        expect(userServer).toBeDefined();
        expect(userServer).toBeInstanceOf(UserServer);
    });

    it('should have proper inheritance from BaseGrpcServer', () => {
        const userServer = new UserServer();
        expect(userServer.addMiddleware).toBeDefined();
        expect(userServer.addService).toBeDefined();
        expect(userServer.wrapWithValidation).toBeDefined();
    });
});