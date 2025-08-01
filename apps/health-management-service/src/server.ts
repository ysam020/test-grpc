import { HealthServer } from './index';
import { serviceConfig } from '@atc/grpc-config';
import { logger } from '@atc/logger';

async function startServer() {
    try {
        const server = new HealthServer();
        server.start(
            serviceConfig.health?.host + ':' + serviceConfig.health?.port,
        );
        logger.info(
            `${HealthServer.name} started at ${serviceConfig.health?.host}:${serviceConfig.health?.port}`,
        );
    } catch (error) {
        logger.error(`Failed to start ${HealthServer.name}: ${error}`);
        process.exit(1);
    }
}

startServer();
