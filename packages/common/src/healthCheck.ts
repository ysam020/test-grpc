import {
    _health_ServiceStatus_ServingStatus as ServingStatus,
    HealthCheckResponse,
} from '@atc/proto';
import * as grpc from '@grpc/grpc-js';
import { logger } from '@atc/logger';

export const healthCheck = async (
    call: grpc.ServerUnaryCall<any, HealthCheckResponse>,
    callback: grpc.sendUnaryData<HealthCheckResponse>,
) => {
    try {
        const services = [
            {
                status: ServingStatus.SERVING,
            },
        ];
        return callback(null, { services });
    } catch (error) {
        logger.error(error);

        const services = [
            {
                status: ServingStatus.UNKNOWN,
            },
        ];
        return callback(null, { services });
    }
};
