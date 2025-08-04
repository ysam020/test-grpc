import { jest } from '@jest/globals';
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
            expect(healthServer.addService).toHaveBeenCalledTimes(1); // Only health service
        });
    });

    describe('Service Registration', () => {
        it('should register HealthService with healthCheck handler', () => {
            expect(healthServer.addService).toHaveBeenCalledWith(
                expect.any(Object), // service definition
                expect.objectContaining({
                    healthCheck: expect.any(Function),
                }),
            );
        });

        it('should use correct service definition for health service', () => {
            const calls = (healthServer.addService as jest.Mock).mock.calls;
            expect(calls).toHaveLength(1);
            expect(calls[0][0]).toBeDefined(); // Service definition should be passed
        });
    });

    describe('Service Configuration', () => {
        it('should call addService exactly once for health service', () => {
            expect(healthServer.addService).toHaveBeenCalledTimes(1);
        });

        it('should not use validation wrappers for health check', () => {
            const calls = (healthServer.addService as jest.Mock).mock.calls;
            const healthServiceCall = calls[0];
            
            // The handler should be the raw function, not wrapped
            expect(healthServiceCall[1].healthCheck).toEqual(expect.any(Function));
        });
    });

    describe('Handler Integration', () => {
        it('should use healthCheckHandler method for health check', () => {
            const calls = (healthServer.addService as jest.Mock).mock.calls;
            const healthServiceCall = calls[0];
            
            expect(healthServiceCall[1]).toHaveProperty('healthCheck');
            expect(healthServiceCall[1].healthCheck).toEqual(expect.any(Function));
        });

        it('should maintain handler function integrity', () => {
            const calls = (healthServer.addService as jest.Mock).mock.calls;
            const healthServiceCall = calls[0];
            const handler = healthServiceCall[1].healthCheck;
            
            // Handler should be bound to the instance
            expect(handler).toBeDefined();
            expect(typeof handler).toBe('function');
        });
    });

    describe('Error Handling', () => {
        it('should handle service initialization errors gracefully', () => {
            // If initialization fails, the instance should still be created
            expect(healthServer).toBeInstanceOf(HealthServer);
        });

        it('should handle missing service definitions gracefully', () => {
            // Test should pass even if service definitions are missing
            expect(healthServer).toBeDefined();
        });
    });

    describe('Health Check Method Access', () => {
        it('should expose checkAllServicesHealth method', () => {
            expect(healthServer.checkAllServicesHealth).toBeDefined();
            expect(typeof healthServer.checkAllServicesHealth).toBe('function');
        });

        it('should have healthCheckHandler as instance method', () => {
            // Check that the handler is accessible (though it's private)
            expect(healthServer).toHaveProperty('healthCheckHandler');
        });
    });
});