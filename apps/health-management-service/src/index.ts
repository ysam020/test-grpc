import { serviceDefinitions } from '@atc/grpc-config';
import {
    HealthCheckRequest__Output,
    HealthCheckResponse,
    _health_ServiceStatus_ServingStatus as ServingStatus,
} from '@atc/proto';
import { BaseGrpcServer } from '@atc/grpc-server';
import * as grpc from '@grpc/grpc-js';
import { serviceConfig } from '@atc/grpc-config';

export class HealthServer extends BaseGrpcServer {
    constructor() {
        super();
        this.initializeServer();
    }

    private initializeServer() {
        this.addService(
            serviceDefinitions.healthPackageDefinition.health.HealthService
                .service,
            {
                healthCheck: this.healthCheckHandler,
            },
        );
    }

    private healthCheckHandler = (
        call: grpc.ServerUnaryCall<
            HealthCheckRequest__Output,
            HealthCheckResponse
        >,
        callback: grpc.sendUnaryData<HealthCheckResponse>,
    ) => {
        this.checkAllServicesHealth()
            .then((statuses) => {
                const services = statuses.map(({ serviceName, status }) => ({
                    service_name: serviceName,
                    status:
                        status === 'SERVING'
                            ? ServingStatus.SERVING
                            : ServingStatus.NOT_SERVING,
                }));
                callback(null, { services });
            })
            .catch((err) => {
                console.error('Health check failed:', err);
                callback(null, { services: [] });
            });
    };

    private async checkAllServicesHealth(): Promise<
        { serviceName: string; status: string }[]
    > {
        const serviceNames = Object.keys(serviceConfig).filter(
            (serviceName) => serviceName.toLowerCase() !== 'health',
        );
        const statuses = await Promise.all(
            serviceNames.map(async (serviceName) => {
                const status = await this.pingServiceHealth(serviceName);
                serviceName = serviceName.toUpperCase();
                return { serviceName, status };
            }),
        );
        return statuses;
    }

    private async pingServiceHealth(serviceName: string): Promise<string> {
        try {
            const serviceAddress = this.getServiceAddress(serviceName);
            if (!serviceAddress) {
                console.error(`Service address not found for ${serviceName}`);
                return ServingStatus.NOT_SERVING;
            }

            const healthService =
                new serviceDefinitions.healthPackageDefinition.health.HealthService(
                    serviceAddress,
                    grpc.credentials.createInsecure(),
                );

            const response = await new Promise<HealthCheckResponse>(
                (resolve, reject) => {
                    healthService.healthCheck(
                        {},
                        (
                            err: grpc.ServiceError | null,
                            res?: HealthCheckResponse,
                        ) => {
                            if (err) {
                                console.error(
                                    `Error checking health of ${serviceName}:`,
                                    err,
                                );
                                reject(err);
                            } else if (res) {
                                resolve(res);
                            } else {
                                reject(
                                    new Error(
                                        'Unexpected response: undefined result without error.',
                                    ),
                                );
                            }
                        },
                    );
                },
            );
            if (response.services && Array.isArray(response.services)) {
                const allHealthy = response.services.every(
                    (service) => service.status === ServingStatus.SERVING,
                );
                return allHealthy ? 'SERVING' : 'NOT_SERVING';
            } else {
                return 'NOT_SERVING';
            }
        } catch (err) {
            console.error(`Error pinging service ${serviceName}:`, err);
            return ServingStatus.NOT_SERVING;
        }
    }

    private getServiceAddress(serviceName: string): string | undefined {
        const serviceDetails = serviceConfig[serviceName.toLowerCase()];
        if (!serviceDetails) {
            console.warn(`Service details not found for ${serviceName}`);
            return undefined;
        }
        return `${serviceDetails.host}:${serviceDetails.port}`;
    }
}
