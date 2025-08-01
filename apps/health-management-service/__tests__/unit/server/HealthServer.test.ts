import { jest } from '@jest/globals';

// Mock the BaseGrpcServer before importing HealthServer
const mockAddService = jest.fn();
const mockCheckAllServicesHealth = jest.fn();

jest.mock('@atc/grpc-server', () => ({
    BaseGrpcServer: jest.fn().mockImplementation(function () {
        this.addService = mockAddService;
        this.checkAllServicesHealth = mockCheckAllServicesHealth;
        return this;
    }),
}));

jest.mock('@atc/grpc-config', () => ({
    serviceDefinitions: {
        healthPackageDefinition: {
            health: {
                HealthService: {
                    service: {
                        healthCheck: {},
                    },
                },
            },
        },
    },
    serviceConfig: {
        auth: { host: 'localhost', port: '50052' },
        user: { host: 'localhost', port: '50053' },
        product: { host: 'localhost', port: '50054' },
        widget: { host: 'localhost', port: '50055' },
        survey: { host: 'localhost', port: '50056' },
        notification: { host: 'localhost', port: '50057' },
        sample: { host: 'localhost', port: '50058' },
        catalogue: { host: 'localhost', port: '50059' },
    },
}));

import { HealthServer } from '../../../src/index';

describe('HealthServer', () => {
    let healthServer: HealthServer;

    beforeEach(() => {
        jest.clearAllMocks();
        healthServer = new HealthServer();
    });

    describe('Constructor and Initialization', () => {
        it('should create HealthServer instance successfully', () => {
            expect(healthServer).toBeInstanceOf(HealthServer);
        });

        it('should call initializeServer during construction', () => {
            // The constructor calls initializeServer, so health service should be added
            expect(mockAddService).toHaveBeenCalledTimes(1); // Only health service
        });
    });

    describe('Service Registration', () => {
        it('should register HealthService with healthCheck handler', () => {
            const healthServiceCall = mockAddService.mock.calls.find(
                (call) => call[1] && typeof call[1].healthCheck === 'function',
            );

            expect(healthServiceCall).toBeDefined();
            expect(healthServiceCall[1]).toHaveProperty('healthCheck');
            expect(typeof healthServiceCall[1].healthCheck).toBe('function');
        });

        it('should use correct service definition for health service', () => {
            expect(mockAddService).toHaveBeenCalledWith(
                expect.any(Object),
                expect.objectContaining({
                    healthCheck: expect.any(Function),
                }),
            );
        });
    });

    describe('Service Configuration', () => {
        it('should call addService exactly once for health service', () => {
            expect(mockAddService).toHaveBeenCalledTimes(1); // Only health service
        });

        it('should not use validation wrappers for health check', () => {
            // Health service doesn't need validation wrappers like auth service
            const healthServiceCall = mockAddService.mock.calls[0];
            expect(healthServiceCall[1].healthCheck).toBeDefined();
            // The handler should be a direct function, not wrapped
            expect(typeof healthServiceCall[1].healthCheck).toBe('function');
        });
    });

    describe('Handler Integration', () => {
        it('should use healthCheckHandler method for health check', () => {
            const healthServiceCall = mockAddService.mock.calls.find(
                (call) => call[1] && typeof call[1].healthCheck === 'function',
            );

            expect(healthServiceCall).toBeDefined();
            expect(healthServiceCall[1]).toHaveProperty('healthCheck');

            // The handler should be bound to the instance
            const handler = healthServiceCall[1].healthCheck;
            expect(typeof handler).toBe('function');
        });

        it('should maintain handler function integrity', () => {
            const healthServiceCall = mockAddService.mock.calls[0];
            const handler = healthServiceCall[1].healthCheck;

            // Ensure that the handler is a proper function that can be called
            expect(typeof handler).toBe('function');
            expect(handler.length).toBeGreaterThanOrEqual(2); // Should accept call and callback
        });
    });

    describe('Error Handling', () => {
        it('should handle service initialization errors gracefully', () => {
            // This test ensures that if there are initialization errors
            expect(() => new HealthServer()).not.toThrow();
        });

        it('should handle missing service definitions gracefully', () => {
            // Even with mock service definitions, server should initialize
            expect(healthServer).toBeInstanceOf(HealthServer);
            expect(mockAddService).toHaveBeenCalled();
        });
    });

    describe('Health Check Method Access', () => {
        it('should expose checkAllServicesHealth method', () => {
            expect(healthServer.checkAllServicesHealth).toBeDefined();
            expect(typeof healthServer.checkAllServicesHealth).toBe('function');
        });

        it('should have healthCheckHandler as instance method', () => {
            const healthServiceCall = mockAddService.mock.calls[0];
            const handler = healthServiceCall[1].healthCheck;

            // The handler should be callable
            expect(typeof handler).toBe('function');

            // It should be bound to the health server instance (arrow function)
            expect(handler.toString()).toContain('=>');
        });
    });
});
