import { logger } from '@atc/logger';
import { UserServer } from './index';
import { serviceConfig } from '@atc/grpc-config';

async function startServer() {
    try {
        const server = new UserServer();
        server.start(serviceConfig.user?.host + ':' + serviceConfig.user?.port);
        logger.info(
            `${UserServer.name} started at ${serviceConfig.user?.host}:${serviceConfig.user?.port}`,
        );
    } catch (error) {
        logger.error(`Failed to start ${UserServer.name}: ${error}`);
        process.exit(1);
    }
}

startServer();
