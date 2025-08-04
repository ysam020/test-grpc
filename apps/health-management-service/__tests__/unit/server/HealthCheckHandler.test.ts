import { jest } from '@jest/globals';
import { HealthServer } from '../../../src/index';

describe('Health Check Handler', () => {
    let healthServer: HealthServer;
    let healthCheckHandler: Function;

    beforeEach(() => {
        jest.clearAllMocks();
        healthServer = new HealthServer();

        // Get the actual health check handler from the addService call
        const addServiceCalls = (healthServer.addService as jest.Mock).mock.calls;
        const healthServiceCall = addServiceCalls.find(
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

            (healthServer.checkAllServicesHealth as jest.Mock).mockResolvedValue(healthyServices);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert
            expect(healthServer.checkAllServicesHealth).toHaveBeenCalledTimes(1);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                services: [
                    { service_name: 'AUTH', status: 1 },
                    { service_name: 'USER', status: 1 },
                    { service_name: 'PRODUCT', status: 1 },
                ],
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

            (healthServer.checkAllServicesHealth as jest.Mock).mockResolvedValue(mixedServices);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                services: [
                    { service_name: 'AUTH', status: 1 },
                    { service_name: 'USER', status: 2 },
                    { service_name: 'PRODUCT', status: 1 },
                ],
            });
        });

        it('should handle empty service list', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            (healthServer.checkAllServicesHealth as jest.Mock).mockResolvedValue([]);

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

            (healthServer.checkAllServicesHealth as jest.Mock).mockResolvedValue([]);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                services: [],
            });
        });

        it('should handle errors gracefully by returning empty array', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            (healthServer.checkAllServicesHealth as jest.Mock).mockRejectedValue(
                new Error('Service check failed')
            );

            // Mock console.error to avoid test output noise
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Wait for the promise chain to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                services: [],
            });

            consoleSpy.mockRestore();
        });

        it('should handle invalid responses gracefully', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            // Return null which should be handled gracefully
            (healthServer.checkAllServicesHealth as jest.Mock).mockResolvedValue(null);

            // Mock console.error to avoid test output noise
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Wait for the promise chain to complete  
            await new Promise(resolve => setTimeout(resolve, 10));

            // Assert - should handle null by returning empty services
            expect(mockCallback).toHaveBeenCalledWith(null, {
                services: [],
            });

            consoleSpy.mockRestore();
        });

        it('should not crash when handler is called', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            (healthServer.checkAllServicesHealth as jest.Mock).mockResolvedValue([]);

            // Act & Assert - should not throw
            expect(() => {
                healthCheckHandler(mockCall, mockCallback);
            }).not.toThrow();

            // Wait for async completion
            await new Promise(resolve => setTimeout(resolve, 10));
            
            expect(mockCallback).toHaveBeenCalled();
        });
    });

    describe('Status Mapping', () => {
        it('should map SERVING status to numeric enum value', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            const servingService = [
                { serviceName: 'AUTH', status: 'SERVING' },
            ];

            (healthServer.checkAllServicesHealth as jest.Mock).mockResolvedValue(servingService);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert - SERVING should map to 1
            expect(mockCallback).toHaveBeenCalledWith(null, {
                services: [
                    { service_name: 'AUTH', status: 1 },
                ],
            });
        });

        it('should map NOT_SERVING status to numeric enum value', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            const notServingService = [
                { serviceName: 'AUTH', status: 'NOT_SERVING' },
            ];

            (healthServer.checkAllServicesHealth as jest.Mock).mockResolvedValue(notServingService);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert - NOT_SERVING should map to 2
            expect(mockCallback).toHaveBeenCalledWith(null, {
                services: [
                    { service_name: 'AUTH', status: 2 },
                ],
            });
        });

        it('should map unknown status to NOT_SERVING', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            const unknownStatusService = [
                { serviceName: 'AUTH', status: 'UNKNOWN_STATUS' },
            ];

            (healthServer.checkAllServicesHealth as jest.Mock).mockResolvedValue(unknownStatusService);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert - Unknown status should default to NOT_SERVING (2)
            expect(mockCallback).toHaveBeenCalledWith(null, {
                services: [
                    { service_name: 'AUTH', status: 2 },
                ],
            });
        });
    });

    describe('Response Format', () => {
        it('should return properly formatted response structure', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            const mockServices = [
                { serviceName: 'AUTH', status: 'SERVING' },
                { serviceName: 'USER', status: 'NOT_SERVING' },
            ];

            (healthServer.checkAllServicesHealth as jest.Mock).mockResolvedValue(mockServices);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, 
                expect.objectContaining({
                    services: expect.arrayContaining([
                        expect.objectContaining({
                            service_name: expect.any(String),
                            status: expect.any(Number),
                        }),
                    ]),
                })
            );
        });

        it('should handle service names correctly', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            const serviceWithSpecialName = [
                { serviceName: 'SPECIAL-SERVICE_NAME', status: 'SERVING' },
            ];

            (healthServer.checkAllServicesHealth as jest.Mock).mockResolvedValue(serviceWithSpecialName);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                services: [
                    { service_name: 'SPECIAL-SERVICE_NAME', status: 1 },
                ],
            });
        });
    });

    describe('Performance', () => {
        it('should complete health check within reasonable time', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            (healthServer.checkAllServicesHealth as jest.Mock).mockResolvedValue([]);

            const startTime = Date.now();

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert
            const endTime = Date.now();
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(1000); // Should complete within 1 second
        });

        it('should handle multiple concurrent health checks', async () => {
            // Arrange
            const mockCall1 = global.grpcTestUtils.createMockCall();
            const mockCall2 = global.grpcTestUtils.createMockCall();
            const mockCallback1 = global.grpcTestUtils.createMockCallback();
            const mockCallback2 = global.grpcTestUtils.createMockCallback();

            (healthServer.checkAllServicesHealth as jest.Mock).mockResolvedValue([]);

            // Act
            await Promise.all([
                healthCheckHandler(mockCall1, mockCallback1),
                healthCheckHandler(mockCall2, mockCallback2),
            ]);

            // Assert
            expect(mockCallback1).toHaveBeenCalled();
            expect(mockCallback2).toHaveBeenCalled();
            expect(healthServer.checkAllServicesHealth).toHaveBeenCalledTimes(2);
        });
    });

    describe('Integration', () => {
        it('should properly integrate with HealthServer instance', () => {
            // Verify that the handler is properly bound to the server instance
            const calls = (healthServer.addService as jest.Mock).mock.calls;
            const healthServiceCall = calls[0];
            
            expect(healthServiceCall).toBeDefined();
            expect(healthServiceCall[1]).toHaveProperty('healthCheck');
        });

        it('should call checkAllServicesHealth method', async () => {
            // Arrange
            const mockCall = global.grpcTestUtils.createMockCall();
            const mockCallback = global.grpcTestUtils.createMockCallback();

            (healthServer.checkAllServicesHealth as jest.Mock).mockResolvedValue([]);

            // Act
            await healthCheckHandler(mockCall, mockCallback);

            // Assert
            expect(healthServer.checkAllServicesHealth).toHaveBeenCalledTimes(1);
        });
    });
});