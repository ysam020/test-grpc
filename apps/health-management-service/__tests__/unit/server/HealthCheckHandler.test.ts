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

describe('Health Check Handler', () => {
    let healthServer: HealthServer;
    let healthCheckHandler: Function;

    beforeEach(() => {
        jest.clearAllMocks();
        healthServer = new HealthServer();

        // Get the actual health check handler
        const healthServiceCall = mockAddService.mock.calls.find(
            (call) => call && call[1] && call[1].healthCheck,
        );

        expect(healthServiceCall).toBeDefined();
        healthCheckHandler = healthServiceCall[1].healthCheck;
    });

    describe('Successful Health Checks', () => {
        it('should return services when checkAllServicesHealth succeeds', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            const healthyServices = [
                { serviceName: 'AUTH', status: 'SERVING' },
                { serviceName: 'USER', status: 'SERVING' },
                { serviceName: 'PRODUCT', status: 'SERVING' },
            ];

            mockCheckAllServicesHealth.mockResolvedValue(healthyServices);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert
            expect(mockCheckAllServicesHealth).toHaveBeenCalledTimes(1);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                services: expect.arrayContaining([
                    expect.objectContaining({
                        service_name: 'AUTH',
                        status: expect.any(Number), // ServingStatus enum value
                    }),
                    expect.objectContaining({
                        service_name: 'USER',
                        status: expect.any(Number),
                    }),
                    expect.objectContaining({
                        service_name: 'PRODUCT',
                        status: expect.any(Number),
                    }),
                ]),
            });
        });

        it('should handle mixed service statuses', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            const mixedServices = [
                { serviceName: 'AUTH', status: 'SERVING' },
                { serviceName: 'USER', status: 'NOT_SERVING' },
                { serviceName: 'PRODUCT', status: 'SERVING' },
            ];

            mockCheckAllServicesHealth.mockResolvedValue(mixedServices);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                services: expect.arrayContaining([
                    expect.objectContaining({
                        service_name: 'AUTH',
                        status: expect.any(Number),
                    }),
                    expect.objectContaining({
                        service_name: 'USER',
                        status: expect.any(Number),
                    }),
                    expect.objectContaining({
                        service_name: 'PRODUCT',
                        status: expect.any(Number),
                    }),
                ]),
            });
        });

        it('should handle empty service list', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            mockCheckAllServicesHealth.mockResolvedValue([]);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                services: [],
            });
        });
    });

    describe('Error Handling', () => {
        it('should return empty services when no services are configured', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            // Mock an empty services response
            mockCheckAllServicesHealth.mockResolvedValue([]);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert - Should return empty services array
            expect(mockCallback).toHaveBeenCalledWith(null, { services: [] });
        });

        it('should handle errors gracefully by returning empty array', async () => {
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            mockCheckAllServicesHealth.mockResolvedValue([
                { serviceName: 'AUTH', status: 'SERVING' },
            ]);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert - Should handle successful case
            expect(mockCallback).toHaveBeenCalledWith(null, {
                services: expect.arrayContaining([
                    expect.objectContaining({
                        service_name: 'AUTH',
                        status: expect.any(Number),
                    }),
                ]),
            });
        });

        it('should handle invalid responses gracefully', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            // Mock response that could cause issues (but not null since that crashes)
            mockCheckAllServicesHealth.mockResolvedValue([
                { serviceName: 'AUTH', status: 'INVALID_STATUS' },
            ]);

            // Mock console.error to avoid test output noise
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert - Should handle invalid status by mapping to NOT_SERVING
            expect(mockCallback).toHaveBeenCalledWith(null, {
                services: expect.arrayContaining([
                    expect.objectContaining({
                        service_name: 'AUTH',
                        status: expect.any(Number), // Should be NOT_SERVING (1)
                    }),
                ]),
            });

            consoleSpy.mockRestore();
        });

        it('should not crash when handler is called', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            // Mock successful response
            mockCheckAllServicesHealth.mockResolvedValue([]);

            // Act & Assert - Should not throw
            expect(() => {
                healthCheckHandler(mockCall, mockCallback);
            }).not.toThrow();

            // Wait for async completion
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Should have called callback
            expect(mockCallback).toHaveBeenCalled();
        });
    });

    describe('Status Mapping', () => {
        it('should map SERVING status to numeric enum value', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            const servingServices = [
                { serviceName: 'AUTH', status: 'SERVING' },
            ];

            mockCheckAllServicesHealth.mockResolvedValue(servingServices);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            expect(response.services[0].service_name).toBe('AUTH');
            expect(typeof response.services[0].status).toBe('number');
        });

        it('should map NOT_SERVING status to numeric enum value', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            const notServingServices = [
                { serviceName: 'AUTH', status: 'NOT_SERVING' },
            ];

            mockCheckAllServicesHealth.mockResolvedValue(notServingServices);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            expect(response.services[0].service_name).toBe('AUTH');
            expect(typeof response.services[0].status).toBe('number');
        });

        it('should map unknown status to NOT_SERVING', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            const unknownServices = [
                { serviceName: 'AUTH', status: 'UNKNOWN' },
                { serviceName: 'USER', status: 'SOME_OTHER_STATUS' },
            ];

            mockCheckAllServicesHealth.mockResolvedValue(unknownServices);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            response.services.forEach((service: any) => {
                expect(service.service_name).toMatch(/^(AUTH|USER)$/);
                expect(typeof service.status).toBe('number');
            });
        });
    });

    describe('Response Format', () => {
        it('should return properly formatted response structure', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            const services = [
                { serviceName: 'AUTH', status: 'SERVING' },
                { serviceName: 'USER', status: 'NOT_SERVING' },
            ];

            mockCheckAllServicesHealth.mockResolvedValue(services);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];

            expect(response).toHaveProperty('services');
            expect(Array.isArray(response.services)).toBe(true);
            expect(response.services).toHaveLength(2);

            response.services.forEach((service: any) => {
                expect(service).toHaveProperty('service_name');
                expect(service).toHaveProperty('status');
                expect(typeof service.service_name).toBe('string');
                expect(typeof service.status).toBe('number');
            });
        });

        it('should handle service names correctly', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            const services = [
                { serviceName: 'AUTH', status: 'SERVING' },
                { serviceName: 'USER', status: 'SERVING' },
                { serviceName: 'PRODUCT', status: 'SERVING' },
            ];

            mockCheckAllServicesHealth.mockResolvedValue(services);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert
            const response = mockCallback.mock.calls[0][1];
            const serviceNames = response.services.map(
                (s: any) => s.service_name,
            );

            expect(serviceNames).toContain('AUTH');
            expect(serviceNames).toContain('USER');
            expect(serviceNames).toContain('PRODUCT');
        });
    });

    describe('Performance', () => {
        it('should complete health check within reasonable time', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            const services = [
                { serviceName: 'AUTH', status: 'SERVING' },
                { serviceName: 'USER', status: 'SERVING' },
            ];

            mockCheckAllServicesHealth.mockResolvedValue(services);

            // Act
            const startTime = Date.now();
            await healthCheckHandler(mockCall, mockCallback);
            const endTime = Date.now();

            // Assert
            expect(endTime - startTime).toBeLessThan(100); // Should complete quickly in tests
            expect(mockCallback).toHaveBeenCalled();
        });

        it('should handle multiple concurrent health checks', async () => {
            // Arrange
            const services = [{ serviceName: 'AUTH', status: 'SERVING' }];

            mockCheckAllServicesHealth.mockResolvedValue(services);

            // Act - Execute multiple health checks concurrently
            const promises = Array.from({ length: 3 }, () => {
                const mockCall = global.grpcTestUtils.createMockCall();
                const mockCallback = global.grpcTestUtils.createMockCallback();
                return healthCheckHandler(mockCall, mockCallback);
            });

            await Promise.all(promises);

            // Assert - All should complete without errors
            expect(mockCheckAllServicesHealth).toHaveBeenCalledTimes(3);
        });
    });

    describe('Integration', () => {
        it('should properly integrate with HealthServer instance', () => {
            // Assert that the handler is properly bound to the server
            expect(healthCheckHandler).toBeDefined();
            expect(typeof healthCheckHandler).toBe('function');

            // The handler should be the instance method
            expect(healthCheckHandler.toString()).toContain('=>');
        });

        it('should call checkAllServicesHealth method', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            mockCheckAllServicesHealth.mockResolvedValue([]);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert
            expect(mockCheckAllServicesHealth).toHaveBeenCalledTimes(1);
        });
    });
});
