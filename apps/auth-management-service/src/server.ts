import { AuthServer } from './index';
import { serviceConfig } from '@atc/grpc-config';
import { logger } from '@atc/logger';

async function startServer() {
    try {
        const server = new AuthServer();
        server.start(serviceConfig.auth?.host + ':' + serviceConfig.auth?.port);
        logger.info(
            `${AuthServer.name} started at ${serviceConfig.auth?.host}:${serviceConfig.auth?.port}`,
        );
    } catch (error) {
        logger.error(`Failed to start ${AuthServer.name}: ${error}`);
        process.exit(1);
    }
}

startServer();
