import { BaseGrpcClient } from '@atc/grpc-client';
import { ServiceConfig } from './service-config';

export class GrpcClientFactory {
    private static clients: Map<string, BaseGrpcClient> = new Map();

    static getClient(service: ServiceConfig): BaseGrpcClient {
        const key = `${service.name}-${service.host}:${service.port}`;

        if (!this.clients.has(key)) {
            const client = new BaseGrpcClient({
                serviceName: service.name,
                address: `${service.host}:${service.port}`,
                options: {
                    timeout: service.timeout,
                    retries: service.retries,
                },
            });
            this.clients.set(key, client);
        }

        return this.clients.get(key)!;
    }
}
