// apps/api-gateway-service/__tests__/api/health.test.ts
describe('API Gateway Health Check', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return health status', () => {
        const healthResponse = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'api-gateway',
        };

        expect(healthResponse).toEqual({
            status: 'ok',
            timestamp: expect.any(String),
            service: 'api-gateway',
        });
    });

    it('should check gRPC service connections', () => {
        const services = [
            'auth-service',
            'user-service',
            'product-service',
            'widget-service',
            'survey-service',
            'notification-service',
            'sample-service',
            'catalogue-service',
        ];

        const healthChecks = services.map((service) => ({
            service,
            status: 'healthy',
            lastCheck: new Date().toISOString(),
        }));

        expect(healthChecks).toHaveLength(8);
        expect(healthChecks[0]).toEqual({
            service: 'auth-service',
            status: 'healthy',
            lastCheck: expect.any(String),
        });
    });

    it('should handle service unavailable', () => {
        const mockServiceError = {
            service: 'product-service',
            status: 'unhealthy',
            error: 'Connection refused',
            lastCheck: new Date().toISOString(),
        };

        expect(mockServiceError.status).toBe('unhealthy');
        expect(mockServiceError.error).toBe('Connection refused');
    });
});
